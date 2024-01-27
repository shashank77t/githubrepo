document.addEventListener("DOMContentLoaded", function () {
  let username = "HuXn-WebDev";

  const repositoriesPerPage = 10;
  let repositoriesData = [];
  let tagsData = [];
  let currentPage = 1;

  const headerUserInfo = document.getElementById("userInfo");
  const headerUserName = headerUserInfo.querySelector("h1");
  const headerBio = document.getElementById("Bio");
  const headerLocation = document.getElementById("Location");
  const headerUserImage = document.getElementById("userImage");
  const headerUrlLink = document.getElementById("Url").querySelector("a");

  // Initial load
  loadRepositories();

  async function loadRepositories() {
    const apiProfileUrl = `https://api.github.com/users/${username}`;
    const apiUrl = `https://api.github.com/users/${username}/repos`;

    // Show loader
    const loader = document.getElementById("loader");
    loader.style.display = "block";

    try {
      // Fetch user profile data
      await getProfile(apiProfileUrl);

      // Fetch user repositories
      let response = await fetch(apiUrl);
      let data = await response.json();

      repositoriesData = data;

      // Fetch additional pages if needed
      while (
        response.headers.get("Link") &&
        response.headers.get("Link").includes('rel="next"')
      ) {
        const nextPageUrl = response.headers
          .get("Link")
          .match(/<([^>]+)>;\s*rel="next"/)[1];
        response = await fetch(nextPageUrl);
        data = await response.json();
        repositoriesData = repositoriesData.concat(data);
      }

      // Render repositories
      renderRepositoriesSlice();

      // Render pagination
      renderPagination();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      // Hide loader
      loader.style.display = "none";
    }
  }

  async function renderRepositoriesSlice() {
    const startIndex = (currentPage - 1) * repositoriesPerPage;
    const endIndex = startIndex + repositoriesPerPage;
    const repositoriesSlice = repositoriesData.slice(startIndex, endIndex);

    const repositoriesList = document.getElementById("repositoryGrid");
    repositoriesList.innerHTML = "";

    // Function to fetch languages for a single repository
    const repoLanguages = async (languages_url) => {
      const response = await fetch(languages_url);
      if (response.ok) {
        const data = await response.json();
        const language = Object.keys(data);
        return language;
      }
      return [];
    };

    // Fetch languages for all repositories concurrently
    const languagePromises = repositoriesSlice.map((repo) =>
      repoLanguages(repo.languages_url)
    );

    // Wait for all language requests to complete
    const languagesArray = await Promise.all(languagePromises);

    // Render repository cards
    repositoriesSlice.forEach((repo, index) => {
      const language = languagesArray[index];

      const tagsContainer = language
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join(" ");

      const repoCard = `
              <div class="col">
                <div class="card repository-card">
                  <div class="card-body">
                    <h5 class="card-title repo-name">${repo.name}</h5>
                    <p class="card-text">${
                      repo.description || "No description available"
                    }</p>
                    <p class="card-text tags-container">${tagsContainer}</p>
                  </div>
                </div>
              </div>
            `;

      repositoriesList.innerHTML += repoCard;
    });

    // Update active state of pagination links
    updatePaginationActiveState();
  }

  // Render pagination links
  function renderPagination() {
    const totalPages = Math.ceil(repositoriesData.length / repositoriesPerPage);
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const activeClass = i === currentPage ? "active" : "";
      const pageLink = `<li class="page-item ${activeClass}"><a class="page-link" href="#">${i}</a></li>`;
      pagination.innerHTML += pageLink;
    }
  }

  // Update active state of pagination links
  function updatePaginationActiveState() {
    const paginationLinks = document.querySelectorAll("#pagination .page-link");
    paginationLinks.forEach((link, index) => {
      const pageNumber = index + 1;
      link.parentElement.classList.toggle("active", pageNumber === currentPage);
    });
  }

  async function getProfile(apiProfileUrl) {
    await fetch(apiProfileUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        let avatarUrl = data.avatar_url;
        let bio = data.bio;
        let location = data.location;

        headerUserName.textContent = data.login || "Username not available";
        headerBio.textContent = bio || "No bio available";
        headerLocation.textContent = location || "No location available";
        headerUserImage.src =
          avatarUrl ||
          "https://res.cloudinary.com/dsxyzdqvo/image/upload/v1705655881/icon-profile-0_ityquz.png";
        headerUrlLink.href = data.html_url || "#";
        headerUrlLink.textContent =
          data.html_url || "Profile URL not available";
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }

  // Function to handle search by user ID
  function searchByUserId() {
    const input = document.getElementById("searchUserIdInput");
    const userId = input.value.trim();

    if (userId !== "") {
      // Set the username variable
      username = userId;

      // Reload repositories for the new user
      loadRepositories();
    }
  }

  // Attach searchByUserId function to the search button click event for user ID
  document
    .getElementById("searchUserIdButton")
    .addEventListener("click", function () {
      searchByUserId();
    });

  // Attach searchByUserId function to the keyup event on the user ID input
  document
    .getElementById("searchUserIdInput")
    .addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        searchByUserId();
      }
    });

  // Event listener for pagination
  document
    .getElementById("pagination")
    .addEventListener("click", function (event) {
      const pageClicked = parseInt(event.target.textContent);
      if (!isNaN(pageClicked)) {
        currentPage = pageClicked;
        renderRepositoriesSlice();
      }
    });

  // Event listener for previous button
  document.getElementById("prevButton").addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      renderRepositoriesSlice();
    }
  });

  // Event listener for next button
  document.getElementById("nextButton").addEventListener("click", function () {
    const totalPages = Math.ceil(repositoriesData.length / repositoriesPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderRepositoriesSlice();
    }
  });
});
