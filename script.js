const list = document.getElementById('todo-list');
const itemCountSpan = document.getElementById('item-count');
const uncheckedCountSpan = document.getElementById('unchecked-count');
const container = document.querySelector('.container');
const statsDiv = document.querySelector('.mb-3');
let currentTheme = localStorage.getItem('todo_theme') || 'light';
document.documentElement.setAttribute('data-bs-theme', currentTheme);

const themeBtn = document.createElement('button');
themeBtn.className = currentTheme === 'dark' ? 'btn btn-light ms-2 mb-3' : 'btn btn-secondary ms-2 mb-3';
themeBtn.textContent = currentTheme === 'dark' ? ' Світла тема' : ' Темна тема';

themeBtn.onclick = function() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('todo_theme', currentTheme);
  document.documentElement.setAttribute('data-bs-theme', currentTheme);
  themeBtn.className = currentTheme === 'dark' ? 'btn btn-light ms-2 mb-3' : 'btn btn-secondary ms-2 mb-3';
  themeBtn.textContent = currentTheme === 'dark' ? ' Світла тема' : ' Темна тема';
};
const newTodoBtn = document.querySelector('button.btn-primary');
newTodoBtn.parentNode.insertBefore(themeBtn, newTodoBtn.nextSibling);

const loadingIndicator = document.createElement('div');
loadingIndicator.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> <span class="ms-2">Завантаження даних...</span>';
loadingIndicator.className = 'd-flex align-items-center mb-3 d-none';
container.insertBefore(loadingIndicator, statsDiv);

const errorAlert = document.createElement('div');
errorAlert.className = 'alert alert-danger d-none mb-3';
container.insertBefore(errorAlert, loadingIndicator);

function showLoading() {
  loadingIndicator.classList.remove('d-none');
  errorAlert.classList.add('d-none');
}

function hideLoading() {
  loadingIndicator.classList.add('d-none');
}

function showError(message) {
  errorAlert.textContent = `Помилка: ${message}`;
  errorAlert.classList.remove('d-none');
}

let todos = [];
const dbUrl = "https://laba7-bd048-default-rtdb.europe-west1.firebasedatabase.app/todos";
async function getTodos() {
  showLoading();
  try {
    const response = await fetch(`${dbUrl}.json`);
    if (!response.ok) throw new Error("Не вдалося завантажити дані");
    
    const data = await response.json();
    if (data) {
      todos = Object.keys(data).map(key => ({
        id: key,
        text: data[key].text,
        isChecked: data[key].isChecked
      }));
    } else {
      todos = [];
    }
    render(todos);
    updateCounter();
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

async function addTodo(taskText) {
  const newTodoData = { text: taskText, isChecked: false };
  const options = {
    method: "POST",
    body: JSON.stringify(newTodoData),
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  };
  
  const response = await fetch(`${dbUrl}.json`, options);
  if (!response.ok) throw new Error("Не вдалося додати завдання");
  const data = await response.json();
  return data.name; 
}

async function newTodo() {
  const taskText = prompt("Введіть нове завдання:");
  if (taskText && taskText.trim() !== "") {
    showLoading();
    try {
      const firebaseId = await addTodo(taskText.trim());
      if (firebaseId) {
        todos.push({ id: firebaseId, text: taskText.trim(), isChecked: false });
        render(todos);
        updateCounter();
      }
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoading();
    }
  }
}

async function deleteTodo(id) {
  showLoading();
  const options = { method: "DELETE" };
  try {
    const response = await fetch(`${dbUrl}/${id}.json`, options);
    if (!response.ok) throw new Error("Не вдалося видалити завдання");
    
    todos = todos.filter(todo => todo.id !== id);
    render(todos);
    updateCounter();
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

async function checkTodo(id) {
  const todo = todos.find(todo => todo.id === id);
  if (todo) {
    showLoading();
    const newStatus = !todo.isChecked;
    const options = {
      method: "PATCH",
      body: JSON.stringify({ isChecked: newStatus }),
      headers: { "Content-Type": "application/json; charset=UTF-8" },
    };

    try {
      const response = await fetch(`${dbUrl}/${id}.json`, options);
      if (!response.ok) throw new Error("Не вдалося змінити статус");
      
      todo.isChecked = newStatus;
      render(todos);
      updateCounter();
    } catch (error) {
      render(todos); 
      showError(error.message);
    } finally {
      hideLoading();
    }
  }
}
function renderTodo(todo) {
  const isCheckedAttr = todo.isChecked ? 'checked' : '';
  const textClass = todo.isChecked ? 'text-success text-decoration-line-through' : '';

  return `
    <li class="list-group-item">
      <input type="checkbox" class="form-check-input me-2" id="${todo.id}" ${isCheckedAttr} onChange="checkTodo('${todo.id}')" />
      <label for="${todo.id}"><span class="${textClass}">${todo.text}</span></label>
      <button class="btn btn-danger btn-sm float-end" onClick="deleteTodo('${todo.id}')">delete</button>
    </li>
  `;
}

function render(todosArray) {
  list.innerHTML = todosArray.map(todo => renderTodo(todo)).join('');
}

function updateCounter() {
  itemCountSpan.textContent = todos.length;
  uncheckedCountSpan.textContent = todos.filter(todo => !todo.isChecked).length;
}
getTodos();