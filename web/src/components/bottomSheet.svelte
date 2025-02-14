<script lang="ts" module>
	export type IRecordingState = 'idle' | 'recording' | 'paused';
	export interface IBottomSheet {
		state: IRecordingState;
		buttonClick: (state: IRecordingState) => void;
	}

	const icons = {
		idle: 'bi:record2',
		recording: 'svg-spinners:bars-scale-middle',
		paused: 'mi:pause'
	};
</script>

<script lang="ts">
	let { state = 'idle', buttonClick }: IBottomSheet = $props();

	const getIcon = () => icons[state];

	const handleClick = () => buttonClick(state);
</script>

<div class="h-[242px] w-[700px] rounded-[24px] bg-[#F7F7F7] px-[20px] py-[26px]">
	<div class="flex h-full w-full flex-col items-center justify-center gap-[24px]">
		<div class="grid h-[60px] w-[60px] shrink-0 place-content-center rounded-[500px] bg-[#E8E8E8]">
			<iconify-icon icon={getIcon()} class="text-black" style="font-size:30px;" iconify-icon>
			</iconify-icon>
		</div>
		<p
			class="font-bold text-[#1A1A1A]"
			style="height: 42px; width:214px; font-size:16px; text-align:center; font-weight:500; line-height:20.79px; font-family:Geist;"
		>
			Transcribing and detecting Bible quotations in real time.
		</p>
		<button
			onclick={handleClick}
			class=" grid h-[48px] w-[227px] cursor-pointer place-content-center rounded-[32px] px-[28px] py-[14px]
      {state === 'recording'
				? 'bg-[#FFDCDB] text-[#FF6259] hover:bg-[#f6bcba]'
				: 'bg-black text-white hover:bg-gray-800'}
    "
		>
			<div class="flex items-center gap-[6px]">
				<iconify-icon
					icon={state === 'recording' ? 'bxs:microphone-off' : 'fa-solid:microphone'}
					style="font-size: 20px;"
				></iconify-icon>
				<p>
					{state === 'recording'
						? 'Stop Listening'
						: state === 'idle'
							? 'Start Listening'
							: 'Continue Listening'}
				</p>
			</div>
		</button>
	</div>
</div>
