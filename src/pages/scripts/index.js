const API_URL = 'https://quotes.free.beeceptor.com/quotes';

fetch(API_URL)
  .then(response => response.json())
  .then(data => {
    const randIndex = Math.floor(Math.random() * data.length);
    const quote = data[randIndex].quote;
    const author = data[randIndex].author;
    const quoteElement = document.getElementById("quote");
    const authorElement = document.getElementById("author");
    quoteElement.innerHTML = quote;
    authorElement.innerHTML = author;
  })
  .catch(error => {
    console.error("Error fetching quote: ", error);
  });
