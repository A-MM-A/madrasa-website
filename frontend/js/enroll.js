// ------------------input field validation
// IDs of fields that should allow only letters (and spaces)
const letterOnlyFields = ['fullName', 'Address', 'school', 'guardianname', 'Occupation', 'GuardianAddress', 'medical-info', 'medical-other'];

// IDs of fields that should allow only numbers
const numberOnlyFields = ['studentPhone', 'age', 'id', 'guardianPhone'];

// Apply letter-only restriction
letterOnlyFields.forEach(function (id) {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
        });
    }
});

// Apply number-only restriction
numberOnlyFields.forEach(function (id) {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
});


//if chooses yes in medical info - in enroll form
document.addEventListener("DOMContentLoaded", function () {
    const medicalSelect = document.getElementById("medical");
    const medicalInfoGroup = document.getElementById("medical-info-group");

    if (medicalSelect && medicalInfoGroup) {
        medicalSelect.addEventListener("change", function () {
            if (medicalSelect.value === "2") {
                medicalInfoGroup.style.display = "block";
            } else {
                medicalInfoGroup.style.display = "none";
            }
        });
    }
});





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
    const currentFields = steps[currentStep].querySelectorAll("input, select, textarea");
    let allValid = true;

    for (const field of currentFields) {
        if (field.hasAttribute("required")) {
            if (field.tagName === "SELECT") {
                if (field.value === "" || field.value === "0") {
                    allValid = false;
                    field.classList.add("invalid");
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    field.focus();
                    break;
                }
            } else if (!field.checkValidity()) {
                allValid = false;
                field.classList.add("invalid");
                field.reportValidity();
                field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }
        }

        // Remove old invalid mark if now valid
        field.classList.remove("invalid");
    }

    if (!allValid) return;

    currentStep ++;
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




// ----------- file preview
document.querySelectorAll('.file-preview').forEach(input => {
    input.addEventListener('change', function () {
        const previewId = this.dataset.preview;
        const previewBox = document.getElementById(previewId);
        const file = this.files[0];

        if (!file) return;

        // Validate file
        let allowedTypes = [];
        let maxMB = 4;

        switch (this.id) {
            case 'birth':
                allowedTypes = ['application/pdf'];
                break;
            case 'repID':
                allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
                break;
            case 'photo':
                allowedTypes = ['image/png', 'image/jpeg'];
                break;
            case 'vaccine':
                allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
                break;
        }

        if (!validateFile(this, allowedTypes, maxMB)) return;

        // Handle PDF with blob, image with base64
        if (file.type === "application/pdf") {
            const blobUrl = URL.createObjectURL(file);
            previewBox.innerHTML = `<iframe src="${blobUrl}" width="100%" height="400px" style="border:none;"></iframe>`;
        } else if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = e => {
                previewBox.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; height: auto;">`;
            };
            reader.readAsDataURL(file);
        } else {
            previewBox.innerHTML = `<p>Preview not supported for this file type.</p>`;
        }
    });
});




function showModal(message) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0'; overlay.style.left = '0';
    overlay.style.width = '100%'; overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.4)';
    overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    const box = document.createElement('div');
    box.style.background = 'white'; box.style.color = 'var(--primary-green)';
    box.style.padding = '1.5rem'; box.style.borderRadius = '8px';
    box.style.maxWidth = '80%'; box.style.textAlign = 'center';
    box.innerText = message;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    setTimeout(() => document.body.removeChild(overlay), 3000);
}

function validateFile(inputEl, allowedTypes, maxMB) {
    const file = inputEl.files[0];
    const previewBox = document.getElementById(inputEl.dataset.preview);
    if (!file) return true;
    if (!allowedTypes.includes(file.type)) {
        // showModal(`\"${file.name}\" must be one of: ${allowedTypes.join(', ')}`);
        showModal(`Please Input A Valid File`);
        inputEl.value = '';
        if (previewBox) previewBox.innerHTML = '';
        return false;
    }
    if (file.size > maxMB * 1024 * 1024) {
        // showModal(`\"${file.name}\" exceeds ${maxMB}MB.`);
        showModal(`File too Big, [Max : ${maxMB}`);
        inputEl.value = '';
        if (previewBox) previewBox.innerHTML = '';
        return false;
    }
    return true;
}



// globalThis.enrollmentData = {}; // temp store form d



// ---------------------- SUBMIT FORM -----------------------

// collecting data from the actual form
async function collectFormData() {
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

    // convert pdf & image to base64 string (for transfer)
    function readFileAsBase64(inputEl) {
        return new Promise(resolve => {
            const file = inputEl.files[0];
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
    }
    
    data.photoBase64 = await readFileAsBase64(document.getElementById('photo'));
    data.birthCertBase64 = await readFileAsBase64(document.getElementById('birth'));
    data.repIDBase64 = await readFileAsBase64(document.getElementById('repID'));
    data.vaccineBase64 = await readFileAsBase64(document.getElementById('vaccine'));

    return data;
}

// generate pdf, download it and mail it and send to db
async function submitForm() {
    try {
        // 1) Collect all the form data & files
        const data = await collectFormData();
        console.log(data);

        // 2) POST to your backend to generate the PDF
        const res = await fetch(`${BASE_URL}/api/pdf/generate-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Server error');

        // 3) Download the PDF
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'enrollment.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showModal('Your PDF has downloaded 🎉');



    } catch (err) {
        console.error('Download error:', err);
        showModal('❌ Failed to download PDF. Please try again.');
    }
}

// Make it globally callable
window.submitForm = submitForm;