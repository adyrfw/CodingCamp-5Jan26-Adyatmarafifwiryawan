// ===== TASK MANAGEMENT APPLICATION =====
document.addEventListener("DOMContentLoaded", function () {
  console.log("TaskMaster Application Started");

  // ===== DOM ELEMENTS =====
  const taskForm = document.getElementById("taskForm");
  const taskTitleInput = document.getElementById("taskTitle");
  const taskCategorySelect = document.getElementById("taskCategory");
  const taskDateInput = document.getElementById("taskDate");
  const taskPriorityInput = document.getElementById("taskPriority");
  const taskList = document.getElementById("taskList");

  // Stats elements
  const totalTasksEl = document.getElementById("totalTasks");
  const completedTasksEl = document.getElementById("completedTasks");
  const pendingTasksEl = document.getElementById("pendingTasks");

  // Filter elements
  const filterStatusButtons = document.querySelectorAll("[data-filter-status]");
  const filterPriorityButtons = document.querySelectorAll(
    "[data-filter-priority]"
  );
  const categoryFilterSelect = document.getElementById("categoryFilter");
  const sortButtons = document.querySelectorAll(".sort-btn");

  // Action buttons
  const clearCompletedBtn = document.getElementById("clearCompleted");
  const exportTasksBtn = document.getElementById("exportTasks");

  // Priority buttons
  const priorityButtons = document.querySelectorAll(".priority-btn");

  // ===== STATE MANAGEMENT =====
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentFilter = {
    status: "all",
    priority: "all",
    category: "all",
  };
  let currentSort = "date";

  // ===== INITIALIZATION =====
  function init() {
    // Set min date to today
    const today = new Date().toISOString().split("T")[0];
    taskDateInput.min = today;
    taskDateInput.value = today;

    // Load initial data
    renderTasks();
    updateStats();

    // Setup event listeners
    setupEventListeners();
  }

  // ===== EVENT LISTENERS SETUP =====
  function setupEventListeners() {
    // Form submission
    taskForm.addEventListener("submit", addTask);

    // Priority selection
    priorityButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        priorityButtons.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        taskPriorityInput.value = this.dataset.priority;
      });
    });

    // Filter buttons
    filterStatusButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        filterStatusButtons.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        currentFilter.status = this.dataset.filterStatus;
        renderTasks();
      });
    });

    filterPriorityButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        filterPriorityButtons.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        currentFilter.priority = this.dataset.filterPriority;
        renderTasks();
      });
    });

    categoryFilterSelect.addEventListener("change", function () {
      currentFilter.category = this.value;
      renderTasks();
    });

    // Sort buttons
    sortButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        sortButtons.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        currentSort = this.dataset.sort;
        renderTasks();
      });
    });

    // Action buttons
    clearCompletedBtn.addEventListener("click", clearCompletedTasks);
    exportTasksBtn.addEventListener("click", exportTasksToJson);
  }

  // ===== TASK FUNCTIONS =====
  function addTask(e) {
    e.preventDefault();

    // Validation
    if (!validateForm()) return;

    // Create new task
    const newTask = {
      id: Date.now(),
      title: taskTitleInput.value.trim(),
      category: taskCategorySelect.value,
      date: taskDateInput.value,
      priority: taskPriorityInput.value,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Add to tasks array
    tasks.push(newTask);

    // Save to localStorage
    saveTasks();

    // Clear form
    taskForm.reset();
    taskDateInput.value = new Date().toISOString().split("T")[0];
    priorityButtons[1].classList.add("active");
    taskPriorityInput.value = "medium";

    // Update UI
    renderTasks();
    updateStats();

    // Show success message
    showNotification("Task added successfully!", "success");
  }

  function validateForm() {
    let isValid = true;

    // Clear previous errors
    document.getElementById("titleError").textContent = "";
    document.getElementById("dateError").textContent = "";

    // Validate title
    if (taskTitleInput.value.trim() === "") {
      document.getElementById("titleError").textContent =
        "Task title is required";
      taskTitleInput.style.borderColor = "#f72585";
      isValid = false;
    } else {
      taskTitleInput.style.borderColor = "#dee2e6";
    }

    // Validate date
    if (taskDateInput.value === "") {
      document.getElementById("dateError").textContent = "Due date is required";
      taskDateInput.style.borderColor = "#f72585";
      isValid = false;
    } else {
      taskDateInput.style.borderColor = "#dee2e6";
    }

    return isValid;
  }

  function toggleTaskStatus(taskId) {
    tasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: task.status === "pending" ? "completed" : "pending",
        };
      }
      return task;
    });

    saveTasks();
    renderTasks();
    updateStats();

    showNotification("Task status updated!", "info");
  }

  function deleteTask(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
      tasks = tasks.filter((task) => task.id !== taskId);
      saveTasks();
      renderTasks();
      updateStats();

      showNotification("Task deleted!", "danger");
    }
  }

  function clearCompletedTasks() {
    if (confirm("Clear all completed tasks?")) {
      tasks = tasks.filter((task) => task.status !== "completed");
      saveTasks();
      renderTasks();
      updateStats();

      showNotification("Completed tasks cleared!", "info");
    }
  }

  // ===== RENDER FUNCTIONS =====
  function renderTasks() {
    // Filter tasks
    let filteredTasks = tasks.filter((task) => {
      // Filter by status
      if (
        currentFilter.status !== "all" &&
        task.status !== currentFilter.status
      ) {
        return false;
      }

      // Filter by priority
      if (
        currentFilter.priority !== "all" &&
        task.priority !== currentFilter.priority
      ) {
        return false;
      }

      // Filter by category
      if (
        currentFilter.category !== "all" &&
        task.category !== currentFilter.category
      ) {
        return false;
      }

      return true;
    });

    // Sort tasks
    filteredTasks.sort((a, b) => {
      if (currentSort === "date") {
        return new Date(a.date) - new Date(b.date);
      } else if (currentSort === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });

    // Clear task list
    taskList.innerHTML = "";

    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
      taskList.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list fa-3x"></i>
                            <h3>No tasks found</h3>
                            <p>Try changing your filters or add a new task</p>
                        </div>
                    </td>
                </tr>
            `;
      return;
    }

    // Render each task
    filteredTasks.forEach((task) => {
      const row = document.createElement("tr");
      row.className = "task-item";
      row.innerHTML = createTaskRowHTML(task);
      taskList.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll(".complete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const taskId = parseInt(this.dataset.taskId);
        toggleTaskStatus(taskId);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const taskId = parseInt(this.dataset.taskId);
        deleteTask(taskId);
      });
    });
  }

  function createTaskRowHTML(task) {
    // Format date
    const dueDate = new Date(task.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dateClass = "";
    if (dueDate < today && task.status === "pending") {
      dateClass = "overdue";
    } else if (dueDate.toDateString() === today.toDateString()) {
      dateClass = "today";
    }

    const formattedDate = dueDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    // Priority class
    const priorityClass = `priority-${task.priority}`;
    const priorityText =
      task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

    // Status class
    const statusClass = `status-${task.status}`;
    const statusText =
      task.status.charAt(0).toUpperCase() + task.status.slice(1);

    // Category class
    const categoryClass = `task-category ${task.category}`;
    const categoryText =
      task.category.charAt(0).toUpperCase() + task.category.slice(1);

    return `
            <td>
                <div class="task-title">${task.title}</div>
            </td>
            <td>
                <span class="${categoryClass}">${categoryText}</span>
            </td>
            <td>
                <div class="task-date ${dateClass}">${formattedDate}</div>
            </td>
            <td>
                <span class="task-priority ${priorityClass}">${priorityText}</span>
            </td>
            <td>
                <span class="task-status ${statusClass}">${statusText}</span>
            </td>
            <td>
                <div class="task-actions">
                    <button class="action-btn ${
                      task.status === "pending" ? "success" : "secondary"
                    } complete-btn" 
                            data-task-id="${task.id}">
                        <i class="fas ${
                          task.status === "pending" ? "fa-check" : "fa-undo"
                        }"></i>
                        ${task.status === "pending" ? "Complete" : "Undo"}
                    </button>
                    <button class="action-btn danger delete-btn" data-task-id="${
                      task.id
                    }">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const pending = total - completed;

    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
  }

  // ===== UTILITY FUNCTIONS =====
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function exportTasksToJson() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `tasks_${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    showNotification("Tasks exported successfully!", "success");
  }

  function showNotification(message, type) {
    // Remove existing notification
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

    // Add styles
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${getNotificationColor(type)};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = "slideIn 0.3s ease reverse";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function getNotificationIcon(type) {
    switch (type) {
      case "success":
        return "fa-check-circle";
      case "danger":
        return "fa-exclamation-circle";
      case "info":
        return "fa-info-circle";
      default:
        return "fa-bell";
    }
  }

  function getNotificationColor(type) {
    switch (type) {
      case "success":
        return "#4cc9f0";
      case "danger":
        return "#f72585";
      case "info":
        return "#4361ee";
      default:
        return "#7209b7";
    }
  }

  // ===== INITIALIZE APP =====
  init();

  // ===== EXPOSE FUNCTIONS TO WINDOW =====
  window.toggleTaskStatus = toggleTaskStatus;
  window.deleteTask = deleteTask;
});
