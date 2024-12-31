/*
* dev: Sazumi Viki
* ig: @moe.sazumiviki
* gh: github.com/sazumivicky
* site: sazumi.moe
*/

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('https://freeipapi.com/api/json');
    const data = await response.json();
    document.getElementById('ipAddress').textContent = data.ipAddress;
    document.getElementById('country').textContent = data.countryName;
    document.getElementById('region').textContent = data.regionName;
    document.getElementById('zipCode').textContent = data.zipCode;
    document.getElementById('languages').textContent = data.language;
    document.getElementById('timeZone').textContent = data.timeZone;
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
  loadHistory();
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  fetchFileInfo();
  if (!localStorage.getItem('welcomePopupShown')) {
    showWelcomePopup();
  }

  let currentSlide = 0;
  const slides = document.querySelectorAll('.review-slide');
  const totalSlides = slides.length;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
  }

  showSlide(currentSlide);
  setInterval(nextSlide, 3000);
});

function showWelcomePopup() {
  const popupContainer = document.createElement('div');
  popupContainer.className = 'welcome-popup-container';

  const popupContent = document.createElement('div');
  popupContent.className = 'welcome-popup-content';

  const popupTitle = document.createElement('h2');
  popupTitle.textContent = 'Welcome to Before Life CDN';

  const popupMessage = document.createElement('pp');
  popupMessage.innerHTML = '<p>With Beforelife Cloud Image Uploader, we provide blazing-fast upload speeds, top-tier security, and seamless performance for your images.<br>Enjoy faster, more secure, and highly reliable image hosting, no matter where your users are located.</p><p>Discover the unique features of our platform, and if you have any questions, our support team is always ready to assist you.<br></p><p>Thank you for choosing Beforelife Cloud Image Uploader!</p>';

  const checkboxContainer = document.createElement('div');
  checkboxContainer.className = 'checkbox-container';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'dontShowAgain';

  const checkboxLabel = document.createElement('label');
  checkboxLabel.htmlFor = 'dontShowAgain';
  checkboxLabel.textContent = "Don't show again";

  checkboxContainer.appendChild(checkbox);
  checkboxContainer.appendChild(checkboxLabel);

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', () => {
    if (checkbox.checked) {
      localStorage.setItem('welcomePopupShown', 'true');
    }
    document.body.removeChild(popupContainer);
  });

  popupContent.appendChild(popupTitle);
  popupContent.appendChild(popupMessage);
  popupContent.appendChild(checkboxContainer);
  popupContent.appendChild(closeButton);
  popupContainer.appendChild(popupContent);
  document.body.appendChild(popupContainer);
}

function fetchFileInfo() {
  fetch('/files')
    .then(response => response.json())
    .then(data => {
      // Update the DOM with total files and size
      document.getElementById('totalFiles').textContent = data.totalFiles || '0';
      document.getElementById('totalSize').textContent = formatSize(data.totalSize || 0);
    })
    .catch(error => {
      console.error('Error fetching file information:', error);
      document.getElementById('totalFiles').textContent = 'Error';
      document.getElementById('totalSize').textContent = 'Error';
    });
}

function formatSize(size) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  displayPreview(file);
});

document.getElementById('fileInput').addEventListener('dragover', function(e) {
  e.preventDefault();
});

document.getElementById('fileInput').addEventListener('drop', function(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  displayPreview(file);
});

document.getElementById('uploadForm').addEventListener('submit', function uploadHandler(e) {
  e.preventDefault();
  const uploadButton = document.querySelector('.upload-button');
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    showPopup('No files selected', 'error');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showPopup('File Size Exceeds 10MB', 'error');
    return;
  }

  uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  uploadButton.disabled = true;

  const formData = new FormData();
  formData.append('fileInput', file);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    uploadButton.innerHTML = 'Refresh';
    uploadButton.disabled = false;
    showPopup('File Uploaded', 'success');
    const fileUrl = data.url_response;

    // Now send the file to the webhook with embed
    sendToWebhook(fileUrl);
    updateHistory(fileUrl);
    saveToLocalStorage(fileUrl);

    document.getElementById('uploadForm').removeEventListener('submit', uploadHandler);
    uploadButton.onclick = function() {
      location.reload();
    };
  })
  .catch(error => {
    uploadButton.innerHTML = 'Upload';
    uploadButton.disabled = false;
    showPopup('Oops Something Went Wrong', 'error');
  });
});

// Function to send the uploaded image URL to the Discord webhook
function sendToWebhook(imageUrl) {
  const webhookUrl = 'https://discord.com/api/webhooks/1323619084751081563/bavkPDanYF1IG_Sk5ehkQhbI8TVH7S0k98qdfjs9BduN4oStc3X7mpCDEDquuN7GpcdN';  // Replace with your Discord webhook URL

  const embed = {
    content: 'A new image has been uploaded!',
    embeds: [
      {
        title: 'Uploaded Image',
        description: 'Here is the uploaded image.',
        image: {
          url: imageUrl
        },
        color: 3066993  // Color of the embed (optional)
      }
    ]
  };

  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(embed)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Webhook successfully sent', data);
  })
  .catch(error => {
    console.error('Error sending webhook:', error);
  });
}

let currentPage = 1;
const filesPerPage = 5;

document.addEventListener('DOMContentLoaded', function() {
  loadFileList();  // Automatically load the file list when the page loads
});

function loadFileList() {
  fetch('/view-files')
    .then(response => response.json())
    .then(data => {
      const fileList = document.getElementById('fileList');
      fileList.innerHTML = '';  // Clear previous list if exists

      const files = data.files;
      const totalFiles = files.length;
      const startIndex = (currentPage - 1) * filesPerPage;
      const endIndex = Math.min(startIndex + filesPerPage, totalFiles);
      
      // Loop through the files for the current page
      files.slice(startIndex, endIndex).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        
        const fileName = document.createElement('p');
        fileName.textContent = file.name;
        
        const viewButton = document.createElement('button');  // Create a button element
        viewButton.textContent = 'View';
        viewButton.onclick = () => window.open(file.url, '_blank');  // Open the image in a new tab
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(viewButton);
        
        fileList.appendChild(fileItem);
      });

      updatePagination(totalFiles);  // Update pagination controls
    })
    .catch(error => {
      console.error('Error fetching file list:', error);
    });
}

function changePage(direction) {
  currentPage += direction;
  loadFileList();
}

function updatePagination(totalFiles) {
  const totalPages = Math.ceil(totalFiles / filesPerPage);
  document.getElementById('currentPage').textContent = `${currentPage}`;
  
  // Disable previous/next buttons if on first/last page
  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function displayPreview(file) {
  const preview = document.getElementById('preview');
  preview.innerHTML = '';
  const fileType = file.type.split('/')[0];
  let previewElement;

  if (fileType === 'image') {
    previewElement = document.createElement('img');
    previewElement.src = URL.createObjectURL(file);
  } else if (fileType === 'video') {
    previewElement = document.createElement('video');
    previewElement.controls = true;
    previewElement.src = URL.createObjectURL(file);
  } else {
    previewElement = document.createElement('div');
    previewElement.className = 'file';
    previewElement.innerText = file.name;
  }

  preview.appendChild(previewElement);
}

function updateHistory(url) {
  const history = document.getElementById('history');
  history.innerHTML = '';

  const link = document.createElement('p');
  link.href = '#';
  link.textContent = url;
  link.addEventListener('click', function(e) {
    e.preventDefault();
    copyToClipboard(url);
  });
  history.appendChild(link);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showPopup('Link Copied!', 'success');
  }).catch(err => {
    showPopup('Failed to Copy Link', 'error');
  });
}

function saveToLocalStorage(url) {
  localStorage.setItem('uploadedFileUrl', url);
}

function loadHistory() {
  const url = localStorage.getItem('uploadedFileUrl');
  if (url) {
    updateHistory(url);
  }
}

function showPopup(message, type = 'error') {
  const popup = document.createElement('div');
  popup.className = `popup ${type}`;
  popup.textContent = message;
  popup.style.animation = 'slideDown 0.3s ease-out forwards';
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => {
      document.body.removeChild(popup);
    }, 500);
  }, 3000);
}

document.querySelector('.go-button.donation').addEventListener('click', function() {
  document.getElementById('donasiPopup').style.display = 'flex';
});

document.addEventListener('DOMContentLoaded', function() {
  loadFileList();  // Automatically load the file list when the page loads
});

document.getElementById('closeDonasiPopup').addEventListener('click', function() {
  document.getElementById('donasiPopup').style.display = 'none';
});