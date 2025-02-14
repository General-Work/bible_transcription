<script lang="ts" module>
	export interface IQuoteFrame {
		quote: string;
		quoteAddress: string;
		translation: string;
	}
</script>

<script lang="ts">
	let { quote = '', quoteAddress = '', translation = '' }: IQuoteFrame = $props();
</script>

<section
	class="grid h-[273px] w-[786px] place-content-center rounded-[39.97px] px-[36px] py-[32px]"
>
	<div class="flex flex-col gap-[24px]">
		<p
			class="h-[47px] w-[714px] text-center"
			style="line-height: 46.63px; font-size:32px; font-weight:700;"
		>
			{quoteAddress} ({translation})
		</p>
		<p
			class="h-[138px] w-[690px]"
			style="font-size: 32px; text-align:center; line-height:46px; font-weight:400px"
		>
			{quote}
		</p>
	</div>
</section>
