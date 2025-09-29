document.getElementById('agreeCheckbox').addEventListener('change', function() {
  document.getElementById('submitButton').disabled = !this.checked;
});
let Commands = [{
  'commands': []
}, {
  'handleEvent': []
}];
function showAds() {
  var ads = [
    'https://www.facebook.com/frenchmangigo.3',
    'https://www.facebook.com/profile.php?id=61567757803215',
    'https://www.facebook.com/frenchclarence.mangigo.9',
    'https://chat-gpt-master.onrender.com'
  ];
  var index = Math.floor(Math.random() * ads.length);
  window.location.href = ads[index];
}

function measurePing() {
  var xhr = new XMLHttpRequest();
  var startTime, endTime;
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      endTime = Date.now();
      var pingTime = endTime - startTime;
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
  const formattedTime = now.toLocaleString('en-US', options);
  document.getElementById('time').textContent = formattedTime;
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: State,
          commands: Commands,
          prefix: document.getElementById('inputOfPrefix').value,
          admin: document.getElementById('inputOfAdmin').value,
        }),
      });
      const data = await response.json();
      if (data.success) {
        jsonInput.value = '';
        showResult(data.message);
        showAds();
      } else {
        jsonInput.value = '';
        showResult(data.message);
        showAds();
      }
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
    setTimeout(() => {
      button.style.display = 'block';
    }, 4000);
  }
}

function showResult(message) {
  const resultContainer = document.getElementById('result');
  resultContainer.innerHTML = `<h5>${message}</h5>`;
  resultContainer.style.display = 'block';
}
async function commandList() {
  try {
    const listOfCommands = document.querySelector('#listOfCommands .command-list');
    const listOfCommandsEvent = document.querySelector('#listOfCommandsEvent .command-list');

    if (!listOfCommands || !listOfCommandsEvent) {
      return;
    }

    listOfCommands.innerHTML = '';
    listOfCommandsEvent.innerHTML = '';

    const response = await fetch('/commands');
    const {
      commands,
      handleEvent,
      aliases
    } = await response.json();

    if (Array.isArray(commands)) {
      commands.forEach((command, index) => {
        const aliasList = Array.isArray(aliases) && Array.isArray(aliases[index]) ? aliases[index] : [];
        listOfCommands.appendChild(createCommandToggle(index + 1, command, 'commands', aliasList));
      });
    }

    if (Array.isArray(handleEvent)) {
      handleEvent.forEach((eventCommand, index) => {
        listOfCommandsEvent.appendChild(createCommandToggle(index + 1, eventCommand, 'handleEvent'));
      });
    }
  } catch (error) {
    console.log(error);
  }
}

function createCommandToggle(order, command, type, aliases = []) {
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('command-toggle');
  button.dataset.command = command;
  button.dataset.type = type;
  button.setAttribute('aria-pressed', 'false');

  const orderBadge = document.createElement('span');
  orderBadge.classList.add('command-order');
  orderBadge.textContent = `${order}.`;

  const name = document.createElement('span');
  name.classList.add('command-name');
  name.textContent = command;

  button.appendChild(orderBadge);
  button.appendChild(name);

  if (aliases.length > 0 && type !== 'handleEvent') {
    const alias = document.createElement('span');
    alias.classList.add('command-alias');
    alias.textContent = aliases.join(', ');
    button.appendChild(alias);
  }

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
    if (index !== -1) {
      collection.splice(index, 1);
    }
    button.classList.remove('is-active');
    button.setAttribute('aria-pressed', 'false');
  }
}

function getCommandCollection(type) {
  return type === 'handleEvent' ? Commands[1].handleEvent : Commands[0].commands;
}

function normalizeCommand(command = '') {
  return command.split(' ')[0];
}

function selectAllCommands() {
  const toggles = document.querySelectorAll(".command-toggle[data-type='commands']");
  if (!toggles.length) {
    return;
  }

  const allActive = Array.from(toggles).every(toggle => toggle.classList.contains('is-active'));
  toggles.forEach(toggle => toggleCommand(toggle, !allActive));
}

function selectAllEvents() {
  const toggles = document.querySelectorAll(".command-toggle[data-type='handleEvent']");
  if (!toggles.length) {
    return;
  }

  const allActive = Array.from(toggles).every(toggle => toggle.classList.contains('is-active'));
  toggles.forEach(toggle => toggleCommand(toggle, !allActive));
}

commandList();
