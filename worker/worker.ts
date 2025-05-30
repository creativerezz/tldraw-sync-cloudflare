import { handleUnfurlRequest } from 'cloudflare-workers-unfurl'
import { AutoRouter, cors, error, type IRequest } from 'itty-router'
import { handleAssetDownload, handleAssetUpload } from './assetUploads'
import type { Environment } from './types'

// make sure our sync durable object is made available to cloudflare
export { TldrawDurableObject } from './TldrawDurableObject'

// we use itty-router (https://itty.dev/) to handle routing. in this example we turn on CORS because
// we're hosting the worker separately to the client. you should restrict this to your own domain.
const { preflight, corsify } = cors({ origin: '*' })
const router = AutoRouter<IRequest, [env: Environment, ctx: ExecutionContext]>({
	before: [preflight],
	finally: [corsify],
	catch: (e) => {
		console.error(e)
		return error(e)
	},
})
	// requests to /connect are routed to the Durable Object, and handle realtime websocket syncing
	.get('/connect/:roomId', (request, env) => {
		const id = env.TLDRAW_DURABLE_OBJECT.idFromName(request.params.roomId)
		const room = env.TLDRAW_DURABLE_OBJECT.get(id)
		return room.fetch(request.url, { headers: request.headers, body: request.body })
	})

	// assets can be uploaded to the bucket under /uploads:
	.post('/uploads/:uploadId', handleAssetUpload)

	// they can be retrieved from the bucket too:
	.get('/uploads/:uploadId', handleAssetDownload)

	// bookmarks need to extract metadata from pasted URLs:
	.get('/unfurl', handleUnfurlRequest)

	// root path - provide API information
	.get('/', () => {
		return new Response(JSON.stringify({
			name: 'Tldraw Sync Worker',
			version: '1.0.0',
			endpoints: {
				connect: '/connect/:roomId - WebSocket connection for room sync',
				upload: 'POST /uploads/:uploadId - Upload assets',
				download: 'GET /uploads/:uploadId - Download assets',
				unfurl: '/unfurl?url=<url> - Get bookmark metadata'
			}
		}, null, 2), {
			headers: { 'Content-Type': 'application/json' }
		})
	})

// export our router for cloudflare
export default router
