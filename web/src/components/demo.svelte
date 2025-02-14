<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { io } from 'socket.io-client';

	let isRecording = false;
	let bibleQuote = { quote: '', translation: '', quoteAddress: '' };
	let error = '';
	let transcription = '';

	let socket: any;

	onMount(() => {
		socket = io('http://localhost:3301');

		socket.on('connect', () => {
			console.log('Socket.IO connected to server.');
		});

		socket.on('transcription', (data) => {
			console.log('Received transcription status:', data);
			if (data.status === 'processing') {
				transcription = data.transcription;
			}
		});

		socket.on('quote', (data) => {
			console.log('Received quote:', data);
			bibleQuote = data;
		});

		socket.on('message', (data) => {
			console.log('Received message:', data);
			error = data;
		});

		socket.on('disconnect', () => {
			console.log('Socket.IO disconnected.');
		});
	});

	onDestroy(() => {
		if (socket) {
			socket.disconnect();
		}
	});

	const startRecording = async () => {
		isRecording = true;
		error = '';
		transcription = '';

		bibleQuote = {
			quote: '',
			translation: '',
			quoteAddress: ''
		};

		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const mediaRecorder = new MediaRecorder(stream);
		const audioChunks: any[] = [];

		mediaRecorder.ondataavailable = (event) => {
			audioChunks.push(event.data);
		};

		mediaRecorder.onstop = async () => {
			const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
			const audioBuffer = await audioBlob.arrayBuffer();
			socket.emit('audioStream', socket.id, new Uint8Array(audioBuffer));
		};

		mediaRecorder.start();
		setTimeout(() => {
			mediaRecorder.stop();
			isRecording = false;
		}, 10000);
	};
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="p-4">
	<h1 class="mb-4 text-2xl font-bold">AI Bible Quotation App</h1>
	<button
		on:click={startRecording}
		class="rounded bg-blue-500 px-4 py-2 text-white"
		disabled={isRecording}
	>
		{isRecording ? 'Recording...' : 'Start Recording'}
	</button>
	{#if transcription}
		<div class="mt-4 rounded bg-gray-100 p-4">
			<p class="text-lg">{transcription}</p>
		</div>
	{/if}
	{#if bibleQuote.quote}
		<div class="mt-4 rounded bg-gray-100 p-4">
			<p class="text-lg">{bibleQuote.quote}</p>
			<p class="text-lg">{bibleQuote.quoteAddress}</p>
			<p class="text-lg">{bibleQuote.translation}</p>
		</div>
	{/if}

	{#if error}
		<div class="mt-4 rounded bg-red-100 p-4 text-red-600">
			<p>{error}</p>
		</div>
	{/if}
</div>
