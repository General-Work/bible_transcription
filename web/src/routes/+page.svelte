<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import BottomSheet from '../components/bottomSheet.svelte';
	import type { IRecordingState } from '../components/bottomSheet.svelte';
	import { io } from 'socket.io-client';
	import QuoteFrame, { type IQuoteFrame } from '../components/quoteFrame.svelte';

	let recordingState = $state<IRecordingState>('idle');
	let generatedQuotation = $state<IQuoteFrame>({
		quote:
			'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
		quoteAddress: 'Romans 8:28',
		translation: 'NIV'
	});
	let socket = $state<any>(null);
	let mediaRecorder = $state<MediaRecorder | null>(null);
	let audioChunks = $state<any[]>([]);
	let processing = $state('');

	const buttonClicked = (state: IRecordingState) => {
		switch (state) {
			case 'idle':
				recordingState = 'recording';
				startRecording();
				break;

			case 'recording':
				recordingState = 'paused';
				pauseRecording();
				break;

			case 'paused':
				recordingState = 'recording';
				resumeRecording();
				break;

			default:
				break;
		}
	};

	const startRecording = async () => {
		processing = '';
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorder = new MediaRecorder(stream);
		audioChunks = [];

		mediaRecorder.ondataavailable = (event) => {
			audioChunks.push(event.data);
		};

		mediaRecorder.onpause = async () => {
			const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
			const audioBuffer = await audioBlob.arrayBuffer();
			socket.emit('audioStream', socket.id, new Uint8Array(audioBuffer));
		};

		mediaRecorder.start();
	};

	const pauseRecording = () => {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.pause();
		}
	};

	const resumeRecording = () => {
		if (mediaRecorder && mediaRecorder.state === 'paused') {
			processing = '';
			mediaRecorder.resume();
		}
	};

	const stopRecording = () => {
		if (mediaRecorder) mediaRecorder.stop();
	};

	onMount(() => {
		socket = io('http://localhost:3301');

		socket.on('connect', () => {
			console.log('Socket.IO connected to server.');
		});

		socket.on('transcription', (data: any) => {
			console.log('Received transcription status:', data);
			if (data.status === 'processing') {
				processing = 'Processing...';
			}
		});

		socket.on('quote', (data: any) => {
			console.log('Received quote:', data);
			generatedQuotation = data;
		});

		socket.on('message', (data: any) => {
			console.log('Received message:', data);
			// error = data;
		});

		socket.on('disconnect', () => {
			console.log('Socket.IO disconnected.');
		});
	});

	onDestroy(() => {
		stopRecording();
		if (socket) {
			socket.disconnect();
		}
	});
</script>

<div class="grid h-full w-full justify-center">
	<div class="flex h-full w-full flex-col">
		<div class="h-full flex-grow">
			<div class="flex h-full items-center justify-center">
				{#if Boolean(processing)}
					<div class="flex h-[273px] w-[786px] flex-col gap-4 justify-center items-center">
						<div class="grid place-content-center">
							<iconify-icon icon="svg-spinners:90-ring-with-bg" style="font-size: 50px;"
							></iconify-icon>
						</div>
						<p
							class="h-[138px] w-[690px] text-center"
							style="font-size: 30px; line-height:46px; font-weight:400px"
						>
							{processing}
						</p>
					</div>
				{:else}
					<QuoteFrame
						quote={generatedQuotation.quote}
						quoteAddress={generatedQuotation.quoteAddress}
						translation={generatedQuotation.translation}
					/>
				{/if}
			</div>
		</div>
		<BottomSheet state={recordingState} buttonClick={buttonClicked} />
	</div>
</div>
