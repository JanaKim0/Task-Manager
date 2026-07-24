/**
 * Interface text in English and Russian.
 *
 * No translation library: the app has one screen's worth of strings, and a
 * plain object keeps everything visible in one file. The English dictionary
 * defines the shape, so TypeScript flags any key the Russian one is missing.
 */

export type Language = 'en' | 'ru';

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
];

/** Locale used for formatting dates, per language. */
export const DATE_LOCALES: Record<Language, string> = {
  en: 'en-GB',
  ru: 'ru-RU',
};

const en = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    create: 'Create',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',
    optional: 'Optional',
    description: 'Description',
    name: 'Name',
    reset: 'Reset',
    dismiss: 'Dismiss',
    language: 'Language',
    theme: 'Theme',
  },

  theme: {
    pink: 'Pink',
    gray: 'Gray',
  },

  nav: {
    workspaces: 'Workspaces',
  },

  /** Browser tab names — and the desktop window title later on. */
  titles: {
    workspaces: 'Workspaces',
    workspace: 'Workspace',
    board: 'Board',
  },

  footer: {
    builtBy: 'Built by',
    sourceCode: 'Source code',
  },

  workspaces: {
    title: 'Workspaces',
    subtitle: 'The top level — projects and boards live inside them.',
    newButton: '+ New workspace',
    namePlaceholder: 'Personal',
    slugLabel: 'Short address (slug)',
    slugPlaceholder: 'personal',
    nameError: 'At least 2 characters',
    slugError: 'Lowercase letters, digits and hyphens only',
    emptyTitle: 'Nothing here yet.',
    emptyHint: 'Create your first workspace to get started.',
    projectCount: 'projects',
    projectCountOne: 'project',
    backToAll: '← all workspaces',
    deleteTitle: 'Delete "{name}"?',
    deleteMessage:
      'Every project, board and card inside it will be deleted too. This cannot be undone.',
    deleteConfirm: 'Delete workspace',
  },

  projects: {
    sectionTitle: 'Projects',
    newButton: '+ New project',
    nameLabel: 'Project name',
    namePlaceholder: 'Portfolio',
    colourLabel: 'Colour',
    createButton: 'Create project',
    saveButton: 'Save changes',
    emptyTitle: 'No projects in this workspace yet.',
    emptyHint: 'Create one — it comes with a ready-made board.',
    openBoard: 'Open board',
    noBoard: 'No board',
    deleteTitle: 'Delete "{name}"?',
    deleteMessage: 'Its board, columns and cards will be deleted too.',
    deleteConfirm: 'Delete project',
  },

  board: {
    loading: 'Loading the board...',
    progress: '{done} of {total} done',
    shown: '{count} shown',
    addColumn: '+ Add column',
    columnNamePlaceholder: 'Column name',
    addColumnButton: 'Add column',
    deleteColumn: 'Delete column',
    dragColumn: 'Drag the column',
    addCard: '+ Add a card',
    cardTitlePlaceholder: 'Card title',
    dragPaused:
      'Dragging is paused while a filter is on — reset the filters to rearrange cards.',
    columnDeleteTitle: 'Delete "{name}"?',
    columnDeleteWithCards:
      '{count} card(s) inside will be deleted too. This cannot be undone.',
    columnDeleteEmpty: 'This cannot be undone.',
  },

  filters: {
    searchPlaceholder: 'Search cards...',
    searchLabel: 'Search cards',
    anyPriority: 'Any priority',
    priorityLabel: 'Filter by priority',
    deadlineLabel: 'Filter by deadline',
    hideDone: 'Hide done',
    noMatches: 'No cards match these filters.',
    resetFilters: 'Reset filters',
    due: {
      any: 'Any date',
      overdue: 'Overdue',
      week: 'Next 7 days',
      none: 'No deadline',
    },
  },

  card: {
    editTitle: 'Edit card',
    titleLabel: 'Title',
    titleError: 'The title cannot be empty',
    deadlineLabel: 'Deadline (optional)',
    clearDeadline: 'Clear',
    priorityLabel: 'Priority',
    markedDone: 'Marked as done',
    notDone: 'Not done yet',
    markAsDone: 'Mark {title} as done',
    deleteTitle: 'Delete "{title}"?',
    deleteMessage: 'The card, its notes and its checklist will be removed.',
    deleteConfirm: 'Delete card',
    checklist: 'Checklist',
    checklistEmpty: 'Break the task into steps.',
    checklistPlaceholder: 'Add a step...',
    checklistTooltip: 'Checklist',
    notes: 'Notes',
    notesTooltip: 'Notes',
    notesEmpty: 'No notes yet.',
    notesLoading: 'Loading notes...',
    notePlaceholder: 'What happened, what to remember...',
  },

  priority: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  },

  due: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    oneDayLate: '1 day late',
    daysLate: '{count} days late',
  },

  errors: {
    offline: 'Cannot reach the server. Is the backend running on port 3333?',
    notFound: 'Not found. It may have been deleted.',
    generic: 'Something went wrong.',
  },
} as const;

/** The shape every language must provide. */
export type Dictionary = {
  [K in keyof typeof en]: { [P in keyof (typeof en)[K]]: string | object };
};

const ru: Dictionary = {
  common: {
    cancel: 'Отмена',
    save: 'Сохранить',
    saving: 'Сохраняю...',
    create: 'Создать',
    add: 'Добавить',
    edit: 'Изменить',
    delete: 'Удалить',
    loading: 'Загрузка...',
    optional: 'Необязательно',
    description: 'Описание',
    name: 'Название',
    reset: 'Сбросить',
    dismiss: 'Закрыть',
    language: 'Язык',
    theme: 'Тема',
  },

  theme: {
    pink: 'Розовая',
    gray: 'Серая',
  },

  nav: {
    workspaces: 'Пространства',
  },

  titles: {
    workspaces: 'Рабочие пространства',
    workspace: 'Пространство',
    board: 'Доска',
  },

  footer: {
    builtBy: 'Автор',
    sourceCode: 'Исходный код',
  },

  workspaces: {
    title: 'Рабочие пространства',
    subtitle: 'Верхний уровень — внутри живут проекты и доски.',
    newButton: '+ Новое пространство',
    namePlaceholder: 'Личное',
    slugLabel: 'Короткий адрес (slug)',
    slugPlaceholder: 'personal',
    nameError: 'Минимум 2 символа',
    slugError: 'Только строчные латинские буквы, цифры и дефис',
    emptyTitle: 'Пока пусто.',
    emptyHint: 'Создайте первое рабочее пространство.',
    projectCount: 'проектов',
    projectCountOne: 'проект',
    backToAll: '← ко всем пространствам',
    deleteTitle: 'Удалить «{name}»?',
    deleteMessage:
      'Все проекты, доски и карточки внутри тоже будут удалены. Это необратимо.',
    deleteConfirm: 'Удалить пространство',
  },

  projects: {
    sectionTitle: 'Проекты',
    newButton: '+ Новый проект',
    nameLabel: 'Название проекта',
    namePlaceholder: 'Портфолио',
    colourLabel: 'Цвет',
    createButton: 'Создать проект',
    saveButton: 'Сохранить',
    emptyTitle: 'В этом пространстве ещё нет проектов.',
    emptyHint: 'Создайте первый — доска появится сразу.',
    openBoard: 'Открыть доску',
    noBoard: 'Нет доски',
    deleteTitle: 'Удалить «{name}»?',
    deleteMessage: 'Доска, колонки и карточки будут удалены вместе с ним.',
    deleteConfirm: 'Удалить проект',
  },

  board: {
    loading: 'Загружаю доску...',
    progress: 'Сделано {done} из {total}',
    shown: 'показано {count}',
    addColumn: '+ Добавить колонку',
    columnNamePlaceholder: 'Название колонки',
    addColumnButton: 'Добавить колонку',
    deleteColumn: 'Удалить колонку',
    dragColumn: 'Перетащить колонку',
    addCard: '+ Добавить карточку',
    cardTitlePlaceholder: 'Название карточки',
    dragPaused:
      'Перетаскивание отключено, пока включён фильтр — сбросьте фильтры, чтобы менять порядок.',
    columnDeleteTitle: 'Удалить «{name}»?',
    columnDeleteWithCards:
      'Карточек внутри: {count}. Они тоже будут удалены. Это необратимо.',
    columnDeleteEmpty: 'Это необратимо.',
  },

  filters: {
    searchPlaceholder: 'Поиск по карточкам...',
    searchLabel: 'Поиск по карточкам',
    anyPriority: 'Любой приоритет',
    priorityLabel: 'Фильтр по приоритету',
    deadlineLabel: 'Фильтр по сроку',
    hideDone: 'Скрыть готовые',
    noMatches: 'Под фильтры ничего не подходит.',
    resetFilters: 'Сбросить фильтры',
    due: {
      any: 'Любая дата',
      overdue: 'Просроченные',
      week: 'Ближайшие 7 дней',
      none: 'Без срока',
    },
  },

  card: {
    editTitle: 'Карточка',
    titleLabel: 'Название',
    titleError: 'Название не может быть пустым',
    deadlineLabel: 'Дедлайн (необязательно)',
    clearDeadline: 'Убрать',
    priorityLabel: 'Приоритет',
    markedDone: 'Отмечена как выполненная',
    notDone: 'Ещё не выполнена',
    markAsDone: 'Отметить «{title}» выполненной',
    deleteTitle: 'Удалить «{title}»?',
    deleteMessage: 'Карточка, её заметки и чек-лист будут удалены.',
    deleteConfirm: 'Удалить карточку',
    checklist: 'Чек-лист',
    checklistEmpty: 'Разбейте задачу на шаги.',
    checklistPlaceholder: 'Добавить шаг...',
    checklistTooltip: 'Чек-лист',
    notes: 'Заметки',
    notesTooltip: 'Заметки',
    notesEmpty: 'Заметок пока нет.',
    notesLoading: 'Загружаю заметки...',
    notePlaceholder: 'Что произошло, что нужно помнить...',
  },

  priority: {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    HIGH: 'Высокий',
    URGENT: 'Срочно',
  },

  due: {
    today: 'Сегодня',
    tomorrow: 'Завтра',
    oneDayLate: 'просрочено на 1 день',
    daysLate: 'просрочено на {count} дн.',
  },

  errors: {
    offline: 'Нет связи с сервером. Backend запущен на порту 3333?',
    notFound: 'Не найдено. Возможно, запись удалили.',
    generic: 'Что-то пошло не так.',
  },
};

export const DICTIONARIES: Record<Language, typeof en> = {
  en,
  ru: ru as typeof en,
};

/** Fills {placeholders} in a string: fill(t.due.daysLate, { count: 3 }). */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? `{${key}}`),
  );
}
