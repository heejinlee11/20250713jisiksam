class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setCurrentDate();
        this.bindEvents();
        this.renderTodos();
        this.updateStats();
    }

    setCurrentDate() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('ko-KR', options);
    }

    bindEvents() {
        // 할일 추가
        const addBtn = document.getElementById('addTodoBtn');
        const todoInput = document.getElementById('todoInput');

        addBtn.addEventListener('click', () => this.addTodo());
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // 필터 버튼들
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.closest('.filter-btn').dataset.filter);
            });
        });

        // 삭제 버튼들
        document.getElementById('clearCompletedBtn').addEventListener('click', () => this.clearCompleted());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
    }

    async addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();

        if (text === '') {
            await Swal.fire({
                icon: 'warning',
                title: '입력 오류',
                text: '할일을 입력해주세요!',
                confirmButtonText: '확인',
                confirmButtonColor: '#667eea',
                showClass: {
                    popup: 'animate__animated animate__fadeInDown'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp'
                }
            });
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        
        input.value = '';
        
        // 성공 토스트 알림
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        Toast.fire({
            icon: 'success',
            title: '할일이 추가되었습니다!',
            background: '#4CAF50',
            color: '#fff'
        });
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            // 완료 상태 변경 토스트 알림
            const message = todo.completed ? '완료되었습니다!' : '대기 상태로 변경되었습니다!';
            const icon = todo.completed ? 'success' : 'info';
            const background = todo.completed ? '#4CAF50' : '#2196F3';
            
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });

            Toast.fire({
                icon: icon,
                title: message,
                background: background,
                color: '#fff'
            });
        }
    }

    async deleteTodo(id) {
        const result = await Swal.fire({
            title: '할일 삭제',
            text: '이 할일을 삭제하시겠습니까?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            }
        });

        if (result.isConfirmed) {
            const todoElement = document.querySelector(`[data-id="${id}"]`);
            if (todoElement) {
                todoElement.classList.add('removing');
                setTimeout(() => {
                    this.todos = this.todos.filter(t => t.id !== id);
                    this.saveTodos();
                    this.renderTodos();
                    this.updateStats();
                    
                    Swal.fire({
                        icon: 'success',
                        title: '삭제 완료',
                        text: '할일이 삭제되었습니다!',
                        timer: 1500,
                        showConfirmButton: false,
                        background: '#4CAF50',
                        color: '#fff'
                    });
                }, 300);
            }
        }
    }

    async editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const { value: newText } = await Swal.fire({
            title: '할일 수정',
            input: 'text',
            inputValue: todo.text,
            inputLabel: '수정할 내용을 입력하세요',
            inputPlaceholder: '할일 내용...',
            showCancelButton: true,
            confirmButtonText: '수정',
            cancelButtonText: '취소',
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d',
            inputValidator: (value) => {
                if (!value || value.trim() === '') {
                    return '할일을 입력해주세요!';
                }
            },
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            }
        });

        if (newText && newText.trim() !== '') {
            todo.text = newText.trim();
            this.saveTodos();
            this.renderTodos();
            
            Swal.fire({
                icon: 'success',
                title: '수정 완료',
                text: '할일이 수정되었습니다!',
                timer: 1500,
                showConfirmButton: false,
                background: '#4CAF50',
                color: '#fff'
            });
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // 필터 버튼 활성화 상태 변경
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTodos();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todoList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        todoList.innerHTML = filteredTodos.map(todo => this.createTodoElement(todo)).join('');
    }

    createTodoElement(todo) {
        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="todoApp.toggleTodo(${todo.id})">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                <div class="todo-actions">
                    <button class="todo-btn edit" onclick="todoApp.editTodo(${todo.id})" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="todo-btn delete" onclick="todoApp.deleteTodo(${todo.id})" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        document.getElementById('totalTodos').textContent = total;
        document.getElementById('completedTodos').textContent = completed;
        document.getElementById('pendingTodos').textContent = pending;
    }

    async clearCompleted() {
        const completedTodos = this.todos.filter(todo => todo.completed);
        
        if (completedTodos.length === 0) {
            await Swal.fire({
                icon: 'info',
                title: '알림',
                text: '완료된 할일이 없습니다!',
                confirmButtonText: '확인',
                confirmButtonColor: '#667eea',
                background: '#2196F3',
                color: '#fff'
            });
            return;
        }

        const result = await Swal.fire({
            title: '완료된 할일 삭제',
            text: `완료된 할일 ${completedTodos.length}개를 모두 삭제하시겠습니까?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            }
        });

        if (result.isConfirmed) {
            this.todos = this.todos.filter(todo => !todo.completed);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            Swal.fire({
                icon: 'success',
                title: '삭제 완료',
                text: '완료된 할일이 모두 삭제되었습니다!',
                timer: 2000,
                showConfirmButton: false,
                background: '#4CAF50',
                color: '#fff'
            });
        }
    }

    async clearAll() {
        if (this.todos.length === 0) {
            await Swal.fire({
                icon: 'info',
                title: '알림',
                text: '삭제할 할일이 없습니다!',
                confirmButtonText: '확인',
                confirmButtonColor: '#667eea',
                background: '#2196F3',
                color: '#fff'
            });
            return;
        }

        const result = await Swal.fire({
            title: '모든 할일 삭제',
            text: `모든 할일 ${this.todos.length}개를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '모두 삭제',
            cancelButtonText: '취소',
            reverseButtons: true,
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            }
        });

        if (result.isConfirmed) {
            this.todos = [];
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            Swal.fire({
                icon: 'success',
                title: '삭제 완료',
                text: '모든 할일이 삭제되었습니다!',
                timer: 2000,
                showConfirmButton: false,
                background: '#4CAF50',
                color: '#fff'
            });
        }
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    // SweetAlert2 설정
    static initSweetAlert() {
        // SweetAlert2 기본 설정
        Swal.mixin({
            customClass: {
                confirmButton: 'btn btn-primary',
                cancelButton: 'btn btn-secondary',
                popup: 'animated fadeIn'
            },
            buttonsStyling: false
        });
    }
}

// 앱 초기화
let todoApp;
document.addEventListener('DOMContentLoaded', () => {
    // SweetAlert2 초기화
    TodoApp.initSweetAlert();
    
    // Todo 앱 초기화
    todoApp = new TodoApp();
    
    // 페이지 로드 완료 알림
    if (todoApp.todos.length === 0) {
        Swal.fire({
            icon: 'info',
            title: '환영합니다!',
            text: '새로운 할일을 추가해보세요.',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
            background: '#667eea',
            color: '#fff'
        });
    }
});
