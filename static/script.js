// Remove all previous code and just keep basic interactions if needed
document.addEventListener('DOMContentLoaded', function() {
    const recommendBtn = document.getElementById('recommend-btn');
    const fashionSelect = document.getElementById('fashion-item');
    const resultsGrid = document.getElementById('results');

    // Load fashion items when page loads
    async function loadFashionItems() {
        try {
            const response = await fetch('/get_items');
            const data = await response.json();
            
            if (data.success) {
                data.items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    fashionSelect.appendChild(option);
                });
            } else {
                console.error('Error:', data.error);
            }
        } catch (error) {
            console.error('Error loading items:', error);
        }
    }

    loadFashionItems();

    recommendBtn.addEventListener('click', async function() {
        const selectedItem = fashionSelect.value;
        if (!selectedItem) {
            alert('Please select a fashion item');
            return;
        }

        // Show loading state
        resultsGrid.innerHTML = '<div class="loading">Loading recommendations...</div>';

        try {
            const response = await fetch('/get_recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ item: selectedItem })
            });

            const data = await response.json();
            
            if (data.success) {
                displayRecommendations(data.recommendations);
            } else {
                resultsGrid.innerHTML = `<p class="error">${data.error || 'No recommendations found'}</p>`;
            }
        } catch (error) {
            console.error('Error:', error);
            resultsGrid.innerHTML = '<p class="error">Error getting recommendations</p>';
        }
    });

    function displayRecommendations(recommendations) {
        resultsGrid.innerHTML = '';
        
        if (!recommendations || recommendations.length === 0) {
            resultsGrid.innerHTML = '<p class="no-results">No recommendations found</p>';
            return;
        }

        recommendations.forEach(item => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <img src="${item.image}" alt="${item.title}" onerror="this.src='static/images/placeholder.jpg'">
                <div class="result-info">
                    <h3>${item.title}</h3>
                </div>
            `;
            resultsGrid.appendChild(card);
        });
    }
});