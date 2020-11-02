const el = document.getElementById.bind(document);
const setupContainer = el("setup")!;
const createTrade = el("createTrade")!;

type State = {
	screenshot: string,
	entry: number,
	stop: number,
	tp: number,
	risk: number,
	reasoning: string,
};

type StateUpdate<T extends keyof State> = {
	key: T,
	value: State[T],
	event: Event,
}

type Control = {
	name: keyof State,
	label: string,
	type: "text" | "textarea",
};

const state: State = {
	screenshot: "",
	entry: 0,
	stop: 0,
	tp: 0,
	risk: 0,
	reasoning: "",
};

const updateState = <T extends keyof State>(stateUpdate: StateUpdate<T>) => {
	const { key, value, event } = stateUpdate;
	if (typeof value === "number" && isNaN(value)) {
		event.preventDefault();
		(el(key) as HTMLInputElement | HTMLTextAreaElement).value = state[key].toString();
		return;
	}
	state[key] = value;
	if (key === "reasoning") {
		el("info")!.innerText = state.reasoning;
	}
	if (key === "screenshot") {
		el("pic")!.setAttribute("src", state.screenshot);
	}
	// el("info")!.innerText = `Updated state of ${stateUpdate.key} with ${stateUpdate.value}`;
};

const renderInput = (control: Control): HTMLElement => {
	let element;
	if (control.type === "text") {
		element = document.createElement("input");
		element.setAttribute("type", "text");
	} else if (control.type === "textarea") {
		element = document.createElement("textarea");
	} else {
		throw "Invalid element type";
	}
	element.id = control.name;
	element.addEventListener("change", function (this: HTMLTextAreaElement | HTMLInputElement, event: Event) {
		const key = this.id as keyof State;
		let value: StateUpdate<typeof key>["value"];
		switch (key) {
			case "entry":
			case "stop":
			case "tp":
			case "risk":
				value = Number(this.value);
				break;
			case "reasoning":
			case "screenshot":
				value = this.value;
				break;
			default:
				throw "Invalid key";
				break;
		}
		updateState({ key, value, event });
	});
	return element;
};

const renderControl = (control: Control): HTMLDivElement => {
	const label = document.createElement("label");
	label.setAttribute("for", control.name);
	label.textContent = control.label;
	const input = renderInput(control);
	
	const labelDiv = document.createElement("div");
	labelDiv.classList.add("col-4");
	labelDiv.appendChild(label);
	const inputDiv = document.createElement("div");
	inputDiv.classList.add("col");
	inputDiv.appendChild(input);

	const row = document.createElement("div");
	row.classList.add("row");
	row.append(labelDiv, inputDiv);
	return row;
};
const controls: Control[] = [
	{
		name: "screenshot",
		label: "Screenshot",
		type: "text",
	},
	{
		name: "entry",
		label: "Entry",
		type: "text",
	},
	{
		name: "stop",
		label: "Stop Loss",
		type: "text",
	},
	{
		name: "tp",
		label: "Take Profit",
		type: "text",
	},
	{
		name: "risk",
		label: "Risk",
		type: "text",
	},
	{
		name: "reasoning",
		label: "Reasoning",
		type: "textarea",
	},
];

controls.forEach(control => setupContainer.appendChild(renderControl(control)));

createTrade.addEventListener("click", event => {
	const assert = (test: boolean, msg: string) => {
		if (!test) {
			alert(msg);
			event.preventDefault();
			throw msg;
		}
	};
	assert(state.entry > 0, "Entry is invalid");
	assert(state.stop > 0, "Stop is invalid");
	assert(state.tp > 0, "Take profit is invalid");
	assert(state.risk > 0 && state.risk <= 5, "Risk is invalid");
	const isShort = state.entry < state.stop && state.entry > state.tp;
	const isLong = state.entry > state.stop && state.entry < state.tp;
	assert((isShort && !isLong) || (isLong && !isShort), "Setup is invalid");
	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = () => {
		if (xhr.readyState !== 4) {
			return;
		}
		if (xhr.status !== 200) {
			return alert(xhr.responseText);
		}
		el("info")!.innerHTML = `<pre>${xhr.responseText}</pre>`;
		createTrade.style.display = "none";
	};
	try {
		xhr.open("POST", "http://localhost:7777");
		xhr.setRequestHeader("content-type", "application/json");
		xhr.send(JSON.stringify(state));	
	} catch (e) {
		alert(e);
	}
});
