const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const favoritesContainer = document.getElementById("favorites");
const viewFavoritesBtn = document.getElementById("viewFavoritesBtn");
const favoritesSection = document.querySelector(".favorites-section");
const resultsSection = document.querySelector(".results-section");
const modal = document.getElementById("recipeModal");
const modalDetails = document.getElementById("modalDetails");
const closeModalBtn = document.querySelector(".close-btn");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// Fetch recipes
async function fetchRecipes(query) {
    resultsContainer.innerHTML = `<p class="placeholder-text">⏳ Loading recipes...</p>`;
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
        const data = await res.json();
        if (!data.meals) {
            resultsContainer.innerHTML = `<p class="placeholder-text">No recipes found for "${query}".</p>`;
            return;
        }
        displayRecipes(data.meals, resultsContainer);
    } catch (err) {
        resultsContainer.innerHTML = `<p class="placeholder-text">❌ Error fetching recipes.</p>`;
    }
}

// Display recipes
function displayRecipes(meals, container) {
    container.innerHTML = meals.map(meal => `
        <div class="recipe-card">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <h3>${meal.strMeal}</h3>
            <button class="details-btn" onclick="viewDetails('${meal.idMeal}')">View Details</button>
            <button class="details-btn" onclick="toggleFavorite('${meal.idMeal}', '${meal.strMeal}', '${meal.strMealThumb}')">❤️ Favorite</button>
        </div>
    `).join("");
}

// View details
async function viewDetails(id) {
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await res.json();
        const meal = data.meals[0];
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`]) {
                ingredients.push(`${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}`);
            }
        }
        modalDetails.innerHTML = `
            <h2>${meal.strMeal}</h2>
            <img src="${meal.strMealThumb}" style="width:100%; border-radius:10px;">
            <h3>Ingredients</h3>
            <ul>${ingredients.map(ing => `<li>${ing}</li>`).join("")}</ul>
            <h3>Instructions</h3>
            <p>${meal.strInstructions}</p>
            ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank">▶ Watch on YouTube</a>` : ""}
        `;
        modal.classList.remove("hidden");
    } catch {
        alert("Error loading recipe details");
    }
}

function addFavorite(id) {
    if (!favorites.includes(id)) {
        favorites.push(id);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        loadFavorites();
    }
}

// Remove from favorites
function removeFavorite(id) {
    favorites = favorites.filter(favId => favId !== id);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    loadFavorites();
}

async function loadFavorites() {
    favoritesContainer.innerHTML = "";

    for (let id of favorites) {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await res.json();
        favoritesContainer.innerHTML += createRecipeCard(data.meals[0], true);
    }
}

// Close modal
closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
window.addEventListener("click", e => {
    if (e.target === modal) modal.classList.add("hidden");
});

loadFavorites();

// Favorites
function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites")) || [];
}

function saveFavorites(favs) {
    localStorage.setItem("favorites", JSON.stringify(favs));
}

function toggleFavorite(id, name, thumb) {
    let favs = getFavorites();
    const exists = favs.find(f => f.id === id);
    if (exists) {
        favs = favs.filter(f => f.id !== id);
    } else {
        favs.push({ id, name, thumb });
    }
    saveFavorites(favs);
    if (!favoritesSection.classList.contains("hidden")) {
        displayFavorites();
    }
}

function displayFavorites() {
    const favs = getFavorites();
    if (favs.length === 0) {
        favoritesContainer.innerHTML = `<p class="placeholder-text">No favorites yet...</p>`;
        return;
    }
    favoritesContainer.innerHTML = favs.map(fav => `
        <div class="recipe-card">
            <img src="${fav.thumb}" alt="${fav.name}">
            <h3>${fav.name}</h3>
            <button class="details-btn" onclick="viewDetails('${fav.id}')">View Details</button>
            <button class="details-btn" onclick="toggleFavorite('${fav.id}', '${fav.name}', '${fav.thumb}')">❌ Remove</button>
        </div>
    `).join("");
}

// Switch between results and favorites
viewFavoritesBtn.addEventListener("click", () => {
    resultsSection.classList.toggle("hidden");
    favoritesSection.classList.toggle("hidden");
    if (!favoritesSection.classList.contains("hidden")) {
        displayFavorites();
    }
});

// Search handlers
searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
        fetchRecipes(query);
    } else {
        resultsContainer.innerHTML = `<p class="placeholder-text">Please enter a search term!</p>`;
    }
});

searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") searchBtn.click();
});
