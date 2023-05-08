import inquirer from 'inquirer';
import cliProgress from 'cli-progress';
import notifier from 'node-notifier';

const timer = {
	totalHours: 0,
	pomodoro: 0,
	shortBreak: 0,
	longBreak: 0,
};

// const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const questions = [
	{
		type: 'input',
		name: 'Ore di lavoro',
		message: 'quante ore di lavoro vuoi fare?',
		default: '12',
		validate(value) {
			if (+value > 0) {
				return true;
			}
			return 'Inserisci un numero maggiore di 0';
		},
		filter(val) {
			timer.totalHours = +val;
			return val;
		},
	},
	{
		type: 'input',
		name: 'durata singolo ciclo',
		message: 'quanto dura un singolo ciclo?',
		default: '2',
		validate(value) {
			if (+value > timer.totalHours) {
				return 'Il ciclo non puo dudare più della durata totale';
			} else if (+value > 0) {
				return true;
			} else {
				return 'Inserisci un numero maggiore di 0';
			}
		},
		filter(val) {
			timer.pomodoro = +val;
			return val;
		},
	},
	{
		type: 'input',
		name: 'durata pausa corte',
		message: 'quanti minuti deve dudrare un pausa corta?',
		default: '3',
		validate(value) {
			if (+value > 0) {
				return true;
			}
			return 'Inserisci un numero maggiore di 0';
		},
		filter(val) {
			timer.shortBreak = +val;
			return val;
		},
	},
	{
		type: 'input',
		name: 'durata pausa lunga',
		message: 'quanti minuti deve durare un pausa lunga?',
		default: '5',
		validate(value) {
			if (+value > 0) {
				return true;
			}
			return 'Inserisci un numero maggiore di 0';
		},
		filter(val) {
			timer.longBreak = +val;
			return val;
		},
	},
];

// create new container
const multibar = new cliProgress.MultiBar(
	{
		clearOnComplete: false,
		hideCursor: true,
		format: ` {bar} | {filename} | {value}/{total}`,
	},
	cliProgress.Presets.shades_classic
);

inquirer.prompt(questions).then(() => {
	// let totalHours = 0;
	let counterShortBreak = 0;

	let state = 'pomodoro';

	// let counterPomoSeconds = 0;
	// add bars
	const barTot = multibar.create(timer.totalHours, 0);
	const barPomo = multibar.create(timer.pomodoro, 0);
	const barShortBreak = multibar.create(timer.shortBreak, 0);
	const barLongBreak = multibar.create(timer.longBreak, 0);

	barTot.update({ filename: 'Ore Totali' });
	barPomo.update({ filename: 'Pomodoro' });
	barShortBreak.update({ filename: 'Pausa corta' });
	barLongBreak.update({ filename: 'Pausa lunga' });

	function pomodoro() {
		return new Promise((resolve) => {
			setTimeout(() => {
				if (counterShortBreak < 3) {
					state = 'shortBreak';
				} else {
					state = 'longBreak';
				}
				resolve();
			}, timer.pomodoro * 1000);
		});
	}

	function finishShortBreak() {
		return new Promise((resolve) => {
			setTimeout(() => {
				state = 'pomodoro';
				resolve();
			}, timer.shortBreak * 1000);
		});
	}

	function finishLongBreak() {
		return new Promise((resolve) => {
			setTimeout(() => {
				counterShortBreak = 0;
				state = 'pomodoro';
				resolve();
			}, timer.longBreak * 1000);
		});
	}

	function clear(interval) {
		clearInterval(interval);
		state = 'finish';
		multibar.stop();
	}

	function updateBar(bar) {
		setTimeout(() => {
			bar.update(0);
		}, 1000);
	}

	async function action() {
		// console.log(barPomo);
		let pomoInt;
		let shortInt;
		let longInt;

		pomoInt = setInterval(() => {
			barPomo.increment();
			barTot.increment();
			// stop action
			if (+barTot.value >= timer.totalHours) {
				clear(pomoInt);
			}
		}, 1000);

		await pomodoro();

		// incremento delle barre totali pomodoro di un 1
		if (+barTot.value < timer.totalHours && timer.pomodoro !== 1) {
			barPomo.increment(1);
			barTot.increment(1);
		}

		// stop action
		if (+barTot.value == timer.totalHours) {
			notifier.notify('é ora di staccare');
			clear(pomoInt);
		}

		clearInterval(pomoInt);

		// update della progress bar interval con un secondo di ritardo
		updateBar(barPomo);

		counterShortBreak++;

		if (state == 'shortBreak') {
			// intervallo short break
			shortInt = setInterval(() => {
				barShortBreak.increment();
			}, 1000);

			await finishShortBreak();
			// incremento della barra shortBreak di un 1
			if (timer.shortBreak !== 1) {
				barShortBreak.increment(1);
			}

			clearInterval(shortInt);

			// update della progress bar interval con un secondo di ritardo
			updateBar(barShortBreak);

			// recall function
			if (timer.totalHours - +barTot.value >= timer.pomodoro) {
				action();
			} else {
				barPomo.total = timer.totalHours - +barTot.value;
				action();
			}
		} else if (state == 'longBreak') {
			// intervallo long break
			longInt = setInterval(() => {
				barLongBreak.increment();
			}, 1000);
			// console.log('3')
			await finishLongBreak();

			// incremento della barra LongBreak di un 1
			if (timer.longBreak !== 1) {
				barLongBreak.increment(1);
			}
			clearInterval(longInt);

			// update della progress bar interval con un secondo di ritardo
			updateBar(barLongBreak);

			// recall function
			if (timer.totalHours - +barTot.value >= timer.pomodoro) {
				action();
			} else {
				barPomo.total = timer.totalHours - +barTot.value;
				action();
			}
		}
	}

	action();
});
