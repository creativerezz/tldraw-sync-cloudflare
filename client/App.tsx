import { useSync } from '@tldraw/sync'
import { Tldraw } from 'tldraw'
import { useState } from 'react'
import { getBookmarkPreview } from './getBookmarkPreview'
import { multiplayerAssetStore } from './multiplayerAssetStore'

// Where is our worker located? Configure this in `vite.config.ts`
const WORKER_URL = process.env.TLDRAW_WORKER_URL

// In this example, the room ID is hard-coded. You can set this however you like though.
const roomId = 'test-room'

function App() {
	const [copied, setCopied] = useState(false)
	
	// Create a store connected to multiplayer.
	const store = useSync({
		// We need to know the websockets URI...
		uri: `${WORKER_URL}/connect/${roomId}`,
		// ...and how to handle static assets like images & videos
		assets: multiplayerAssetStore,
	})

	const handleInvite = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error('Failed to copy to clipboard:', err)
		}
	}

	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			{/* Invite Button */}
			<button
				type="button"
				onClick={handleInvite}
				style={{
					position: 'fixed',
					bottom: '24px',
					right: '24px',
					zIndex: 1000,
					padding: '16px 24px',
					backgroundColor: copied ? '#4ade80' : '#3b82f6',
					color: 'white',
					border: 'none',
					borderRadius: '12px',
					cursor: 'pointer',
					fontSize: '16px',
					fontWeight: '600',
					boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
					transition: 'all 0.2s ease',
					minWidth: '120px',
					textAlign: 'center',
				}}
				onMouseEnter={(e) => {
					if (!copied) {
						e.currentTarget.style.backgroundColor = '#2563eb'
					}
				}}
				onMouseLeave={(e) => {
					if (!copied) {
						e.currentTarget.style.backgroundColor = '#3b82f6'
					}
				}}
			>
				{copied ? '✓ Copied!' : '🔗 Invite'}
			</button>
			
			<Tldraw
				// we can pass the connected store into the Tldraw component which will handle
				// loading states & enable multiplayer UX like cursors & a presence menu
				store={store}
				onMount={(editor) => {
					// when the editor is ready, we need to register our bookmark unfurling service
					editor.registerExternalAssetHandler('url', getBookmarkPreview)
				}}
			/>
		</div>
	)
}

export default App
