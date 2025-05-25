// open menu toggle - all files
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');
menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
});



// ----------index page: start

//hero slide animation - in index page
(function () {
    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.getElementById('hero-dots');
    let current = 0, timer;

    // Create dots
    slides.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(btn);
    });

    const dots = dotsContainer.querySelectorAll('button');

    function show(index) {
        slides.forEach((s, i) => s.classList.toggle('active', i === index));
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
        current = index;
    }

    function next() {
        show((current + 1) % slides.length);
    }

    function goTo(i) {
        clearInterval(timer);
        show(i);
        timer = setInterval(next, 5000);
    }

    // Initialize
    show(0);
    timer = setInterval(next, 5000);
});


// enroll popup - in index page
function openEnrollModal(e) {
    e.preventDefault();
    document.getElementById('enrollModal').style.display = 'flex';
    document.body.classList.add('no-scroll');
}
function closeEnrollModal() {
    document.getElementById('enrollModal').style.display = 'none';
    document.body.classList.remove('no-scroll');
}
/* optional: close if click outside content */
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('enrollModal');

    if (!modal) return;

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeEnrollModal();
        }
    });
});



// ----------index page: end




// ----------enroll page: start
// next steps and previous in forms - in enroll form 
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep() {
    currentStep--;
    showStep(currentStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep(index) {
    if (index <= currentStep) {
        currentStep = index;
        showStep(index);
    }
}


//if chooses yes in medical info - in enroll form
const medicalSelect = document.getElementById('medical');
const infoGroup = document.getElementById('medical-info-group');

medicalSelect.addEventListener('change', function () {
    if (this.value === "1") {
        infoGroup.style.display = "block";
    } else {
        infoGroup.style.display = "none";
    }
});


//file preview - in enroll form
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


//fee price pop up - in enroll form
function showPricingPopup(event) {
    event.preventDefault();
    document.body.classList.add('popup-open');
    document.getElementById('pricingPopup').style.display = 'flex';
}

function closePricingPopup() {
    document.getElementById('pricingPopup').style.display = 'none';
    document.body.classList.remove('popup-open');
}


// ----------enroll page: end