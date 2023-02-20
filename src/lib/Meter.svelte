<script>
	let speed = 0;

	let updatedSpeed;

	let speedometer;
	let speedometerValue = speedometer.find('.speedometer-value');

	function startSpeedometerSpeed() {
		if (speed == 100) {
			clearInterval(igniteSpeedometer);
		}

		speed += 10;
		updatedSpeed = Math.round((speed * 180) / 100) - 45;
		speedometerValue.css('transform', 'rotate(' + updatedSpeed + 'deg)');
	}

	var igniteSpeedometer = setInterval(startSpeedometerSpeed, 500);
</script>

<div class="wrapper-center">
	<div class="speedometer" bind:this={speedometer}>
		<div class="speedometer-value" />
		<div class="speedometer-groove" />
		<div class="speedometer-base" />
	</div>
</div>
>

<style lang="scss">
	@mixin size($width, $height) {
		width: $width;
		height: $height;
	}

	@mixin pos($pos, $top, $left) {
		left: $left;
		position: $pos;
		top: $top;
	}

	.speedometer {
		@include size(155px, 155px);
		position: relative;

		&-value {
			@include size(155px, 155px);
			@include pos(absolute, 0, 0);
			background: #000;
			border: var(6px) solid #ed1c24;
			border-color: transparent transparent #ed1c24 #ed1c24;
			border-radius: 50%;
			box-shadow: -2.5px 2.5px 5px 0 rgba(255, 0, 0, 0.45),
				inset 2.5px -2.5px 5px 0 rgba(255, 0, 0, 0.45);
			box-sizing: border-box;
			position: relative;
			transform: rotate(-45deg);
			transition: transform 300ms cubic-bezier(0.2, 0, 0, 1.2);
			z-index: 1;

			&::after {
				content: '';
				@include size(155px + 2, 155px + 2);
				position: absolute;
				top: 50%;
				left: 50%;
				background: transparent;
				transform: translate(-50%, -50%);
				border-radius: 50%;
				border: var(6px) - 4 solid rgba(255, 255, 255, 0.15);
			}

			&::before {
				content: '';
				@include size(155px - 8, 155px - 8);
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				border-radius: 50%;
				background: transparent;
				border: var(6px) - 4 solid rgba(0, 0, 0, 0.2);
			}
		}

		&-groove {
			@include size(155px, 155px / 2);
			@include pos(absolute, 0, 0);
			background: #000;
			border: 20px solid #000;
			border-bottom: 0;
			border-top-left-radius: 155px / 1;
			border-top-right-radius: 155px / 1;
			box-sizing: border-box;
		}

		&-base {
			@include size(155px + 60, 155px / 2 + 60);
			@include pos(absolute, calc(50% - 20px), -20px);
			background: #000;
			z-index: 2;
		}
	}

	.wrapper-center {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
</style>
