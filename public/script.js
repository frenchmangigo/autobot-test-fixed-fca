document.getElementById('agreeCheckbox').addEventListener('change', function() {
  document.getElementById('submitButton').disabled = !this.checked;
});

let Commands = [
  { 'commands': [] },
  { 'handleEvent': [] }
];

function showAds() {
  const ads = [
    'https://www.facebook.com/frenchmangigo.3',
    'https://www.facebook.com/profile.php?id=61567757803215',
    'https://www.facebook.com/frenchclarence.mangigo.9',
    'https://chat-gpt-master.onrender.com'
  ];
  const index = Math.floor(Math.random() * ads.length);
  window.location.href = ads[index];
}

function measurePing() {
  const xhr = new XMLHttpRequest();
  let startTime, endTime;
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      endTime = Date.now();
      const pingTime = endTime - startTime;
      document.getElementById("ping").textContent = pingTime + " ms";
    }
  };
  xhr.open("GET", location.href + "?t=" + new Date().getTime());
  startTime = Date.now();
  xhr.send();
}
setInterval(measurePing, 1000);

function updateTime() {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Manila',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  };
  document.getElementById('time').textContent = now.toLocaleString('en-US', options);
}
updateTime();
setInterval(updateTime, 1000);

async function State() {
  const jsonInput = document.getElementById('json-data');
  const button = document.getElementById('submitButton');
  if (!Commands[0].commands.length) {
    return showResult('Please provide at least one valid command for execution.');
  }
  try {
    button.style.display = 'none';
    const State = JSON.parse(jsonInput.value);
    if (State && typeof State === 'object') {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: State,
          commands: Commands,
          prefix: document.getElementById('inputOfPrefix').value,
          admin: document.getElementById('inputOfAdmin').value,
        }),
      });
      const data = await response.json();
      jsonInput.value = '';
      showResult(data.message);
      showAds();
    } else {
      jsonInput.value = '';
      showResult('Invalid JSON data. Please check your input.');
      showAds();
    }
  } catch (parseError) {
    jsonInput.value = '';
    console.error('Error parsing JSON:', parseError);
    showResult('Error parsing JSON. Please check your input.');
    showAds();
  } finally {
    setTimeout(() => { button.style.display = 'block'; }, 4000);
  }
}

function submitForm(event) {
  event.preventDefault();
  State();
}

function showResult(message) {
  const resultContainer = document.getElementById('result');
  resultContainer.innerHTML = `<h5>${message}</h5>`;
  resultContainer.style.display = 'block';
}

async function commandList() {
  const commandPanel = document.querySelector('#listOfCommands');
  const eventPanel = document.querySelector('#listOfCommandsEvent');
  if (!commandPanel || !eventPanel) return;

  const commandCollection = commandPanel.querySelector('[data-collection]');
  const commandEmpty = commandPanel.querySelector('[data-empty]');
  const eventCollection = eventPanel.querySelector('[data-collection]');
  const eventEmpty = eventPanel.querySelector('[data-empty]');
  if (!commandCollection || !eventCollection) return;

  const showEmptyState = (emptyState, isEmpty, fallbackCopy) => {
    if (!emptyState) return;
    if (typeof fallbackCopy === 'string') emptyState.textContent = fallbackCopy;
    emptyState.hidden = !isEmpty;
  };

  commandCollection.innerHTML = '';
  eventCollection.innerHTML = '';
  showEmptyState(commandEmpty, true);
  showEmptyState(eventEmpty, true);

  try {
    const response = await fetch('/commands');
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const { commands, handleEvent, aliases } = await response.json();

    if (Array.isArray(commands)) {
      commands.forEach((command, index) => {
        const aliasList = Array.isArray(aliases) && Array.isArray(aliases[index]) ? aliases[index] : [];
        commandCollection.appendChild(createCommandToggle(index + 1, command, 'commands', aliasList));
      });
    }

    if (Array.isArray(handleEvent)) {
      handleEvent.forEach((eventCommand, index) => {
        eventCollection.appendChild(createCommandToggle(index + 1, eventCommand, 'handleEvent'));
      });
    }

    showEmptyState(commandEmpty, !commandCollection.children.length);
    showEmptyState(eventEmpty, !eventCollection.children.length);

  } catch (error) {
    console.error(error);
    showEmptyState(commandEmpty, true, 'Unable to load commands right now.');
    showEmptyState(eventEmpty, true, 'Unable to load event commands right now.');
  }
}

function createCommandToggle(order, command, type, aliases = []) {
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('command-chip');
  button.dataset.command = command;
  button.dataset.type = type;
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('role', 'listitem');
  button.title = `Toggle ${command}`;

  const iconWrap = document.createElement('span');
  iconWrap.classList.add('chip-check');
  const icon = document.createElement('i');
  icon.classList.add('fas', 'fa-plus');
  iconWrap.appendChild(icon);

  const body = document.createElement('span');
  body.classList.add('chip-body');

  const line = document.createElement('span');
  line.classList.add('chip-line');

  const orderBadge = document.createElement('span');
  orderBadge.classList.add('chip-order');
  orderBadge.textContent = order;

  const name = document.createElement('span');
  name.classList.add('chip-name');
  name.textContent = command;

  line.appendChild(orderBadge);
  line.appendChild(name);
  body.appendChild(line);

  if (aliases.length > 0 && type !== 'handleEvent') {
    const alias = document.createElement('span');
    alias.classList.add('chip-alias');
    alias.textContent = `Aliases: ${aliases.join(', ')}`;
    body.appendChild(alias);
  }

  button.appendChild(iconWrap);
  button.appendChild(body);
  button.addEventListener('click', () => toggleCommand(button));

  return button;
}

function toggleCommand(button, forceState) {
  const type = button.dataset.type;
  const command = button.dataset.command || '';
  const collection = getCommandCollection(type);
  const normalizedCommand = normalizeCommand(command);
  const isActive = button.classList.contains('is-active');
  const shouldActivate = typeof forceState === 'boolean' ? forceState : !isActive;

  if (shouldActivate) {
    if (!collection.includes(normalizedCommand)) {
      collection.push(normalizedCommand);
    }
    button.classList.add('is-active');
    button.setAttribute('aria-pressed', 'true');
  } else {
    const index = collection.indexOf(normalizedCommand);
    if (index !== -1) collection.splice(index, 1);
    button.classList.remove('is-active');
    button.setAttribute('aria-pressed', 'false');
  }

  const icon = button.querySelector('.chip-check i');
  if (icon) {
    icon.classList.toggle('fa-plus', !button.classList.contains('is-active'));
    icon.classList.toggle('fa-check', button.classList.contains('is-active'));
  }
}

function getCommandCollection(type) {
  return type === 'handleEvent' ? Commands[1].handleEvent : Commands[0].commands;
}

function normalizeCommand(command = '') {
  return command.split(' ')[0];
}

function selectAllCommands() {
  const toggles = document.querySelectorAll(".command-chip[data-type='commands']");
  if (!toggles.length) return;
  const allActive = Array.from(toggles).every(toggle => toggle.classList.contains('is-active'));
  toggles.forEach(toggle => toggleCommand(toggle, !allActive));
}

function selectAllEvents() {
  const toggles = document.querySelectorAll(".command-chip[data-type='handleEvent']");
  if (!toggles.length) return;
  const allActive = Array.from(toggles).every(toggle => toggle.classList.contains('is-active'));
  toggles.forEach(toggle => toggleCommand(toggle, !allActive));
}

commandList();
