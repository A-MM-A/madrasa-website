// open menu toggle
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');
menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
});


// next steps and previous in forms
const steps = document.querySelectorAll(".form-step");
const indicators = document.querySelectorAll(".step-indicator li");
let currentStep = 0;

function showStep(index) {
    steps.forEach((step, i) => {
        step.classList.toggle("active", i === index);
        indicators[i].classList.toggle("current", i === index);
        if (i < index) indicators[i].classList.add("completed");
        else indicators[i].classList.remove("completed");
        indicators[i].classList.toggle("disabled", i > currentStep);
    });
}

function nextStep() {
    const inputs = steps[currentStep].querySelectorAll("input");
    for (const input of inputs) {
        if (!input.checkValidity()) {
            input.reportValidity();
            return;
        }
    }
    currentStep++;
    showStep(currentStep);
}

function prevStep() {
    currentStep--;
    showStep(currentStep);
}

function goToStep(index) {
    if (index <= currentStep) {
        currentStep = index;
        showStep(index);
    }
}



// open menu , ===
// function toggleMenu() {
//     document.querySelector(".nav-links").classList.toggle("active");
// }

// document.getElementById("enrollForm").addEventListener("submit", function (e) {
//     e.preventDefault();
//     alert("Enrollment submitted successfully!");
// });

// document.getElementById('menu-toggle').addEventListener('click', () => {
//     document.getElementById('main-nav').classList.toggle('open');
// });



//if chooses yes in medical info
const medicalSelect = document.getElementById('medical');
const infoGroup = document.getElementById('medical-info-group');

medicalSelect.addEventListener('change', function () {
    if (this.value === "1") {
        infoGroup.style.display = "block";
    } else {
        infoGroup.style.display = "none";
    }
});


//file preview
document.querySelectorAll('.file-preview').forEach(input => {
    input.addEventListener('change', function () {
        const previewId = this.dataset.preview;
        const previewBox = document.getElementById(previewId);
        const file = this.files[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            if (file.type.startsWith("image/")) {
                previewBox.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            } else if (file.type === "application/pdf") {
                previewBox.innerHTML = `<iframe src="${e.target.result}" width="100%" height="400px"></iframe>`;
            } else {
                previewBox.innerHTML = `<p>Preview not supported for this file type.</p>`;
            }
        };
        reader.readAsDataURL(file);
    });
});


//fee price pop up
function showPricingPopup(event) {
    event.preventDefault();
    document.body.classList.add('popup-open');
    document.getElementById('pricingPopup').style.display = 'flex';
}

function closePricingPopup() {
    document.getElementById('pricingPopup').style.display = 'none';
    document.body.classList.remove('popup-open');
}

