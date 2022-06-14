let clusterer

document.addEventListener('DOMContentLoaded', () => {
  ymaps.ready(init);
  function init() {
    const myMap = new ymaps.Map('map', {
      center: [55.76, 37.64],
      controls: ['zoomControl'],
      zoom: 13
    });

    myMap.events.add('click', async function (e) {
      const coords = e.get('coords');
      openBalloon(myMap, coords, []);
    });

    clusterer = new ymaps.Clusterer({ clusterDisableClickZoom: true });
    clusterer.options.set('hasBalloon', false);

    getGeoObjects(myMap)
    clusterer.events.add('click', function(e) {
      let geoObjectsInCluster = e.get('target').getGeoObjects()
      openBalloon(myMap, e.get('coords'), geoObjectsInCluster)
    })

  }
});

function getReviewList(currentGeoObjects) {
  let reviewListHTML = '';
  
  for (const review of getReviewsFromLS()) {
    if (currentGeoObjects.some(geoObject => JSON.stringify(geoObject.geometry._coordinates) === JSON.stringify(review.coords))) {
      reviewListHTML += `
        <div class="review">
          <div><strong>Место: </strong>${review.place}</div>
          <div><strong>Имя: </strong>${review.author}</div>
          <div><strong>Отзыв: </strong>${review.reviewText}</div>
        </div>  
      `;
    }
  }
  return reviewListHTML;
}

function getReviewsFromLS() {
  const reviews = localStorage.reviews
  return JSON.parse(reviews || "[]")
}

function getGeoObjects(map) {
  const geoObjects = []
  for (const review of getReviewsFromLS() || []) {
    const placemark = new ymaps.Placemark(review.coords);
    placemark.events.add('click', e => {
      e.stopPropagation();
      openBalloon(map, e.get('coords'), [e.get('target')])
    })
    geoObjects.push(placemark);
  }

  clusterer.removeAll()
  map.geoObjects.remove(clusterer)
  clusterer.add(geoObjects)
  map.geoObjects.add(clusterer)
}


async function openBalloon(map, coords, currentGeoObjects) {
  await map.balloon.open(coords, {
    content: `<div class="reviews">${getReviewList(currentGeoObjects)}</div>` + formBalloon,
  });
  document.querySelector('#add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const review = {
      coords,
      author: this.elements.author.value,
      place: this.elements.place.value,
      reviewText: this.elements.review.value,
    };

    localStorage.reviews = JSON.stringify([...getReviewsFromLS(), review])

    getGeoObjects(map)

    map.balloon.close();
  });
}






const formBalloon = `
<h3>Отзыв:</h3>
<form id="add-form">
  <input type="text" placeholder="Укажите ваше имя" name="place"><br><br>
  <input type="text" placeholder="Укажите место" name="author"><br><br>
  <textarea placeholder="Оставить отзыв" name="review" class="review__text"></textarea><br><br>
  <button id="add-btn">Добавить</button><br>
</form>
`