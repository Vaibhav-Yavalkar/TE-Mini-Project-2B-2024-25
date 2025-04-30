// Function to make a request to the Flask backend API and display recommendations
function getRecommendations() {
    // Get user input values
    const location = document.getElementById('location').value;
    const foodType = document.getElementById('food_type').value;
    const ratings = document.getElementById('ratings').value;
  
    // Validate inputs
    if (!location || !foodType || !ratings) {
      alert("Please fill in all fields!");
      return;
    }
  
    // Make a GET request to the backend API
    const url = `http://127.0.0.1:5000/recommend?location=${location}&food_type=${foodType}&ratings=${ratings}`;
  
    fetch(url)
      .then(response => response.json())
      .then(data => {
        // Check for errors
        if (data.error) {
          alert("Error: " + data.error);
          return;
        }
  
        // Get the list of recommended restaurants
        const recommendations = data.recommendations;
  
        // Clear previous results
        const restaurantCards = document.getElementById('restaurant-cards');
        restaurantCards.innerHTML = '';
  
        // Display each recommended restaurant
        recommendations.forEach(restaurant => {
          const card = document.createElement('div');
          card.classList.add('card');
          
          card.innerHTML = `
            <img src="${restaurant.details.image_url}" alt="${restaurant.details.name}">
            <h3>${restaurant.details.name}</h3>
            <p class="rating">Rating: ${restaurant.details.rating}</p>
            <p class="address">Address: ${restaurant.details.address}</p>
          `;
  
          // Append the card to the results container
          restaurantCards.appendChild(card);
        });
      })
      .catch(error => {
        alert("Error fetching data: " + error);
      });
  }
  