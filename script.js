// open menu toggle - all files
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');
menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
});



// ----------index page: start

// slideshow js in index.html file


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
document.addEventListener("DOMContentLoaded", function () {
    const medicalSelect = document.getElementById("medical");
    const medicalInfoGroup = document.getElementById("medical-info-group");

    if (medicalSelect && medicalInfoGroup) {
        medicalSelect.addEventListener("change", function () {
            if (medicalSelect.value === "1") {
                medicalInfoGroup.style.display = "block";
            } else {
                medicalInfoGroup.style.display = "none";
            }
        });
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



// Final submission: generate and download PDF - in enroll page
// async function submitForm() {
//   // 1) Gather form data
//   const data = {
//     fullName: document.getElementById('fullName').value,
//     birthDate: document.getElementById('birthDate').value,
//     gender: document.getElementById('gender').value,
//     address: document.getElementById('Address').value,
//     nationality: document.getElementById('nation').value,
//     email: document.getElementById('email').value,
//     guardianPhone: document.getElementById('guardianPhone').value,
//     id: Date.now().toString()
//   };

//   // 2) Request PDF from backend
//   const res = await fetch('http://localhost:3000/generate-pdf', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data)
//   });

//   if (!res.ok) {
//     alert('PDF generation failed.');
//     return;
//   }

//   // 3) Download the PDF
//   const blob = await res.blob();
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = 'enrollment.pdf';
//   a.click();
// }

// // Attach to the new Confirm button
// document.getElementById('confirmBtn').addEventListener('click', () => {
//   // ensure all validation and final step checks pass
//   submitForm();
// });

// helper to read a file input as base64 string (without data: prefix)
function readFileAsBase64(inputEl) {
    return new Promise(resolve => {
        const file = inputEl.files[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
}

// Final submission: generate and download PDF
async function submitForm() {
    // 1) Gather all form fields
    const data = {
        fullName: document.getElementById('fullName')?.value || '',
        birthDate: document.getElementById('birthDate')?.value || '',
        gender: document.getElementById('gender')?.value || '',
        address: document.getElementById('Address')?.value || '',
        nationality: document.getElementById('nation')?.value || '',
        studentemail: document.getElementById('studentemail')?.value || '',
        studentPhone: document.getElementById('studentPhone')?.value || '',
        representative: document.getElementById('representative')?.value || '',
        guardianname: document.getElementById('guardianname')?.value || '',
        guardianGender: document.getElementById('guardianGender')?.value || '',
        Occupation: document.getElementById('Occupation')?.value || '',
        GuardianAddress: document.getElementById('GuardianAddress')?.value || '',
        GuardianNationality: document.getElementById('GuardianNationality')?.value || '',
        id: document.getElementById('id')?.value || '',
        guardianPhone: document.getElementById('guardianPhone')?.value || '',
        email: document.getElementById('email')?.value || '',
        medical: document.getElementById('medical')?.value || '',
        medical_info: document.getElementById('medical-info')?.value || ''
    };

    // 2) Read file inputs as base64
    data.photoBase64 = await readFileAsBase64(document.getElementById('photo'));
    data.birthCertBase64 = await readFileAsBase64(document.getElementById('birth'));
    data.repIDBase64 = await readFileAsBase64(document.getElementById('repID'));
    data.vaccineBase64 = await readFileAsBase64(document.getElementById('vaccine'));

    // 3) Send to backend
    const response = await fetch('http://localhost:3000/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        alert('Failed to generate PDF');
        return;
    }

    // 4) Download the PDF
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enrollment.pdf';
    a.click();
}

// Attach to the new Confirm button
document.getElementById('confirmBtn').addEventListener('click', () => {
  // ensure all validation and final step checks pass
  submitForm();
});

// ----------enroll page: end