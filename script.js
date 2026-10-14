(() => {
  // Footer year
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Mobile navigation
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#nav-links');
  if (toggle && nav) {
    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      nav.classList.remove('is-open');
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
      nav.classList.toggle('is-open', !isOpen);
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  // Turn the simple text in content.js into project cards.
  const projectList = document.querySelector('#project-list');
  const currentlyText = document.querySelector('#currently-text');
  if (!projectList && !currentlyText) return;

  const makeElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const emptyValue = (value) => !value || /^(none|n\/a|-)$/i.test(value.trim());

  function readPortfolioText(text) {
    const projects = [];
    let currently = '';
    let project = null;

    const saveProject = () => {
      if (project && project.name) {
        project.tags = project.tagsText
          ? project.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean)
          : [];
        projects.push(project);
      }
      project = null;
    };

    text.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) return;

      const colon = line.indexOf(':');
      if (colon < 0) return;
      const key = line.slice(0, colon).trim().toUpperCase();
      const value = line.slice(colon + 1).trim();

      if (key === 'CURRENTLY') {
        currently = value;
        return;
      }
      if (key === 'PROJECT') {
        saveProject();
        project = {
          name: value,
          status: '',
          description: '',
          note: '',
          tagsText: '',
          linkText: 'View project',
          link: ''
        };
        return;
      }
      if (!project) return;

      if (key === 'STATUS') project.status = value;
      if (key === 'DESCRIPTION') project.description = value;
      if (key === 'NOTE') project.note = emptyValue(value) ? '' : value;
      if (key === 'TAGS') project.tagsText = emptyValue(value) ? '' : value;
      if (key === 'LINK TEXT') project.linkText = emptyValue(value) ? '' : value;
      if (key === 'LINK') project.link = emptyValue(value) ? '' : value;
    });

    saveProject();
    return { currently, projects };
  }

  function renderProject(project, index) {
    const article = makeElement('article', 'project');
    const number = makeElement('div', 'project-index mono');
    number.append(document.createTextNode(String(index + 1).padStart(2, '0')));
    number.append(makeElement('span', '', ' / PROJECT'));
    article.append(number);

    const main = makeElement('div', 'project-main');
    const titleLine = makeElement('div', 'project-title-line');
    titleLine.append(makeElement('h3', '', project.name || 'Untitled project'));

    if (project.status) {
      const status = makeElement('span', 'status');
      status.append(makeElement('span', 'status-dot'));
      status.append(document.createTextNode(` ${project.status}`));
      titleLine.append(status);
    }
    main.append(titleLine);

    if (project.description) main.append(makeElement('p', '', project.description));
    if (project.note) main.append(makeElement('p', 'project-honesty', project.note));

    if (project.tags.length) {
      const tags = makeElement('div', 'tag-list');
      tags.setAttribute('aria-label', 'Topics');
      project.tags.forEach((tag) => tags.append(makeElement('span', '', tag)));
      main.append(tags);
    }

    if (project.link && /^https?:\/\//i.test(project.link)) {
      const link = makeElement('a', 'text-link', `${project.linkText || 'View project'} ↗`);
      link.href = project.link;
      link.target = '_blank';
      link.rel = 'noreferrer';
      main.append(link);
    }

    article.append(main);
    return article;
  }

  try {
    if (typeof window.PORTFOLIO_TEXT !== 'string') {
      throw new Error('The editable text is missing from content.js.');
    }
    const content = readPortfolioText(window.PORTFOLIO_TEXT);
    if (currentlyText) {
      currentlyText.textContent = content.currently || 'Just exploring something new.';
    }
    projectList.replaceChildren();
    if (content.projects.length === 0) {
      projectList.append(makeElement('p', 'project-loading', 'Projects will appear here soon.'));
    } else {
      content.projects.forEach((project, index) => projectList.append(renderProject(project, index)));
    }
    projectList.setAttribute('aria-busy', 'false');
  } catch (error) {
    console.error(error);
    if (currentlyText) currentlyText.textContent = 'Still figuring things out.';
    if (projectList) {
      projectList.replaceChildren(makeElement('p', 'project-loading', 'Project details are temporarily unavailable. Please try again later.'));
      projectList.setAttribute('aria-busy', 'false');
    }
  }
})();
