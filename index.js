let lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];
let foundItems = JSON.parse(localStorage.getItem("foundItems")) || [];

document.querySelector("#report form").addEventListener("submit", function(e) {
    e.preventDefault();

    let item = {
        name: this.item_name.value,
        description: this.description.value,
        date: this.date_lost.value,
        location: this.location.value
    };

    lostItems.push(item);
    localStorage.setItem("lostItems", JSON.stringify(lostItems));

    alert("Lost item reported successfully!");
    this.reset();
});

document.querySelector("#found form").addEventListener("submit", function(e) {
    e.preventDefault();

    let inputs = this.querySelectorAll("input, textarea");

    let item = {
        name: inputs[0].value,
        description: inputs[1].value,
        date: inputs[2].value,
        location: inputs[3].value
    };

    foundItems.push(item);
    localStorage.setItem("foundItems", JSON.stringify(foundItems));

    alert("Found item reported successfully!");
    this.reset();
});

document.querySelector("#search form").addEventListener("submit", function(e) {
    e.preventDefault();

    let keyword = this.querySelector("input").value.toLowerCase();
    let resultsList = document.querySelector("#search ul");

    resultsList.innerHTML = "";

    let results = [...lostItems, ...foundItems];

    let filtered = results.filter(item => 
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
    );

    if (filtered.length === 0) {
        resultsList.innerHTML = "<li>No items found</li>";
        return;
    }

    filtered.forEach(item => {
        let li = document.createElement("li");
        li.textContent = `${item.name} - ${item.location}`;
        resultsList.appendChild(li);
    });
});

window.onload = function() {
    let resultsList = document.querySelector("#search ul");
    resultsList.innerHTML = "";

    let allItems = [...lostItems, ...foundItems];

    allItems.forEach(item => {
        let li = document.createElement("li");
        li.textContent = `${item.name} - ${item.location}`;
        resultsList.appendChild(li);
    });
};