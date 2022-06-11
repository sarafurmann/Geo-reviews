import InteractiveMap from './interactiveMap';

export default class GeoReview {
  constructor() {
    this.formTemplate = document.querySelector('#addFormTemplate').innerHTML;
    this.map = new InteractiveMap('map', this.onClick.bind(this));
    this.map.init().then(this.onInit.bind(this));
  }

  async onInit() {
    const coords = await this.callApi('coords');

    for (const item of coords) {
      for (let i = 0; i < item.total; i++) {
        this.map.createPlacemark(item.coords);
      }
    }

    document.body.addEventListener('click', this.onDocumentClick.bind(this));
  }

  async callApi(method, body = {}) {
    const res = await fetch(`/homework_8/${method}`, {
      method: 'post',
      body: JSON.stringify(body),
    });
    return await res.json();
  }

  async insertAddress(coords, addressField) {
    return (addressField.textContent = await this.map.getStreetNameWithClick(coords));
  }

  createForm(coords, reviews) {
    const root = document.createElement('div');
    root.innerHTML = this.formTemplate;
    const reviewList = root.querySelector('.reviews__list');
    const reviewForm = root.querySelector('[data-role=review-form]');
    reviewForm.dataset.coords = JSON.stringify(coords);

    for (const item of reviews) {
      const li = document.createElement('li');
      li.classList.add('review__item');
      li.innerHTML = `
      <div class="review__heading"> 
      <div class="review__author">${item.name}</div>
      <div class="review__location">${item.place}</div>
      <div class="review__date">${item.date}</div>
      </div>
      <div class="review__content">${item.text}</div>
      `;
      reviewList.appendChild(li);
    }

    return root;
  }

  async onClick(coords) {
    await this.map.openBalloon(coords, 'Загрузка...');
    const list = await this.callApi('list', { coords });
    const form = this.createForm(coords, list);
    this.map.setBalloonContent(form.innerHTML);
    const addressField = document.querySelector('[data-role=click-address]');
    await this.insertAddress(coords, addressField);
  }

  getTodayDate() {
    return new Date();
  }

  formatDate(date) {
    let hours = date.getHours();
    if (hours < 10) {
      hours = '0' + hours;
    }

    let minutes = date.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    let day = date.getDate();
    if (day < 10) {
      day = '0' + day;
    }

    let month = date.getMonth();
    if (month === 0) {
      month = 'января';
    } else if (month === 1) {
      month = 'февраля';
    } else if (month === 2) {
      month = 'марта';
    } else if (month === 3) {
      month = 'апреля';
    } else if (month === 4) {
      month = 'мая';
    } else if (month === 5) {
      month = 'июня';
    } else if (month === 6) {
      month = 'июля';
    } else if (month === 7) {
      month = 'августа';
    } else if (month === 8) {
      month = 'сентября';
    } else if (month === 9) {
      month = 'октября';
    } else if (month === 10) {
      month = 'ноября';
    } else {
      month = 'декабря';
    }

    const year = date.getFullYear();

    return `${hours}:${minutes} ${day} ${month} ${year} года`;
  }

  async onDocumentClick(e) {
    if (e.target.dataset.role === 'review-add') {
      const reviewForm = document.querySelector('[data-role=review-form]');
      const coords = JSON.parse(reviewForm.dataset.coords);
      const data = {
        coords,
        review: {
          name: document.querySelector('[data-role=review-name]').value,
          place: document.querySelector('[data-role=review-place]').value,
          text: document.querySelector('[data-role=review-text]').value,
          date: this.formatDate(this.getTodayDate()),
        },
      };

      try {
        await this.callApi('add', data);
        this.map.createPlacemark(coords);
        this.map.closeBalloon();
      } catch (e) {
        const formError = document.querySelector('.form-error');
        formError.innerText = e.message;
      }
    }
  }
}