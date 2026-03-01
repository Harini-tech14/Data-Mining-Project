document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('career-form');
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const loading = document.getElementById('loading');
   
    let currentStep = 1;
    const totalSteps = 4;
   
    const selectedSkills = new Set();
    const selectedInterests = new Set();
    const selectedIndustries = new Set();
   
    async function loadSkills() {
        try {
            const response = await fetch('/api/skills');
            const skills = await response.json();
            const container = document.getElementById('skills-container');
           
            for (const [category, skillList] of Object.entries(skills)) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'skill-category';
               
                const categoryTitle = document.createElement('h3');
                categoryTitle.textContent = category.replace('_', ' ');
                categoryDiv.appendChild(categoryTitle);
               
                const skillsListDiv = document.createElement('div');
                skillsListDiv.className = 'skills-list';
               
                skillList.forEach(skill => {
                    const tag = createTag(skill, 'skill');
                    skillsListDiv.appendChild(tag);
                });
               
                categoryDiv.appendChild(skillsListDiv);
                container.appendChild(categoryDiv);
            }
        } catch (error) {
            console.error('Error loading skills:', error);
        }
    }
   
    async function loadInterests() {
        try {
            const response = await fetch('/api/interests');
            const interests = await response.json();
            const container = document.getElementById('interests-container');
           
            interests.forEach(interest => {
                const tag = createTag(interest, 'interest');
                container.appendChild(tag);
            });
        } catch (error) {
            console.error('Error loading interests:', error);
        }
    }
   
    async function loadIndustries() {
        try {
            const response = await fetch('/api/industries');
            const industries = await response.json();
            const container = document.getElementById('industries-container');
           
            industries.forEach(industry => {
                const tag = createTag(industry, 'industry');
                container.appendChild(tag);
            });
        } catch (error) {
            console.error('Error loading industries:', error);
        }
    }
   
    function createTag(value, type) {
        const tag = document.createElement('label');
        tag.className = 'tag';
        tag.textContent = formatLabel(value);
       
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = type;
        input.value = value;
        tag.appendChild(input);
       
        tag.addEventListener('click', function(e) {
            e.preventDefault();
           
            if (type === 'skill') {
                if (selectedSkills.has(value)) {
                    selectedSkills.delete(value);
                    tag.classList.remove('selected');
                } else {
                    selectedSkills.add(value);
                    tag.classList.add('selected');
                }
            } else if (type === 'interest') {
                if (selectedInterests.has(value)) {
                    selectedInterests.delete(value);
                    tag.classList.remove('selected');
                } else {
                    selectedInterests.add(value);
                    tag.classList.add('selected');
                }
            } else if (type === 'industry') {
                if (selectedIndustries.has(value)) {
                    selectedIndustries.delete(value);
                    tag.classList.remove('selected');
                } else if (selectedIndustries.size < 5) {
                    selectedIndustries.add(value);
                    tag.classList.add('selected');
                }
            }
        });
       
        return tag;
    }
   
    function formatLabel(str) {
        return str.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
   
    function updateProgressBar() {
        progressSteps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');
           
            if (stepNum < currentStep) {
                step.classList.add('completed');
            } else if (stepNum === currentStep) {
                step.classList.add('active');
            }
        });
    }
   
    function showStep(step) {
        steps.forEach(s => s.classList.remove('active'));
        document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
       
        prevBtn.disabled = step === 1;
       
        if (step === totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'flex';
        } else {
            nextBtn.style.display = 'flex';
            submitBtn.style.display = 'none';
        }
       
        updateProgressBar();
    }
   
    function validateStep(step) {
        switch (step) {
            case 1:
                if (selectedSkills.size < 3) {
                    alert('Please select at least 3 skills to continue.');
                    return false;
                }
                return true;
            case 2:
                if (selectedInterests.size < 2) {
                    alert('Please select at least 2 interests to continue.');
                    return false;
                }
                return true;
            case 3:
                const education = document.getElementById('education').value;
                if (!education) {
                    alert('Please select your education level.');
                    return false;
                }
                return true;
            case 4:
                return true;
            default:
                return true;
        }
    }
   
    nextBtn.addEventListener('click', function() {
        if (validateStep(currentStep)) {
            currentStep++;
            showStep(currentStep);
        }
    });
   
    prevBtn.addEventListener('click', function() {
        currentStep--;
        showStep(currentStep);
    });
   
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
       
        if (!validateStep(currentStep)) {
            return;
        }
       
        const userData = {
            skills: Array.from(selectedSkills),
            interests: Array.from(selectedInterests),
            education_level: document.getElementById('education').value,
            experience_years: parseInt(document.getElementById('experience').value) || 0,
            preferred_industries: Array.from(selectedIndustries),
            work_style: document.getElementById('work-style').value,
            salary_expectation: document.getElementById('salary').value
        };
       
        sessionStorage.setItem('userData', JSON.stringify(userData));
       
        form.style.display = 'none';
        loading.classList.remove('hidden');
       
        setTimeout(() => {
            window.location.href = '/results';
        }, 1500);
    });
   
    loadSkills();
    loadInterests();
    loadIndustries();
});