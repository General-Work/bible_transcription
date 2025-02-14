<script lang="ts">
	import '../app.css';
	import 'iconify-icon';

	let { children } = $props();
</script>

<div class="h-screen w-screen bg-[#ECECEC] py-10">
	<main class="flex h-full w-full flex-col">
		<header class="flex items-center justify-center">
			<p
				class="text-[#1A1A1A]"
				style="font-weight: 700; font-size:20px; font-family: Geist; line-height: 26px;"
			>
				VerseCatch
			</p>
		</header>
		{@render children()}
	</main>
</div>
