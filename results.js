document.addEventListener('DOMContentLoaded', async function() {
    const resultsContainer = document.getElementById('results-container');
    const loading = document.getElementById('loading');
    const modal = document.getElementById('career-modal');
    const modalClose = document.getElementById('modal-close');
    const modalBody = document.getElementById('modal-body');
   
    const userData = JSON.parse(sessionStorage.getItem('userData'));
   
    if (!userData) {
        window.location.href = '/';
        return;
    }
   
    try {
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
       
        const recommendations = await response.json();
       
        loading.style.display = 'none';
       
        if (recommendations.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <h3>No matches found</h3>
                    <p>Try adjusting your skills and preferences to get better matches.</p>
                    <a href="/" class="btn btn-primary">Start Over</a>
                </div>
            `;
            return;
        }
       
        recommendations.forEach((career, index) => {
            const card = createCareerCard(career, index + 1);
            resultsContainer.appendChild(card);
        });
       
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        loading.innerHTML = `
            <p style="color: var(--danger-color);">Error loading recommendations. Please try again.</p>
            <a href="/" class="btn btn-primary">Start Over</a>
        `;
    }
   
    function createCareerCard(career, rank) {
        const card = document.createElement('div');
        card.className = 'career-card';
       
        const matchClass = career.match_percentage >= 70 ? 'high' :
                          career.match_percentage >= 50 ? 'medium' : 'low';
       
        const matchingSkills = career.skill_gaps.matching.slice(0, 5);
        const missingSkills = career.skill_gaps.missing_required.slice(0, 3);
       
        card.innerHTML = `
            <div class="career-card-header">
                <div class="career-card-title">
                    <h3>#${rank} ${career.title}</h3>
                    <span class="industry">${career.industry}</span>
                </div>
                <div class="match-badge ${matchClass}">${career.match_percentage}% Match</div>
            </div>
            <p class="career-card-description">${career.description}</p>
            <div class="career-card-meta">
                <div class="meta-item">
                    <span class="icon">💰</span>
                    <span>${formatSalaryINR(career.salary_range.min)} - ${formatSalaryINR(career.salary_range.max)}</span>
                </div>
                <div class="meta-item">
                    <span class="icon">📈</span>
                    <span>${career.growth_outlook} Growth</span>
                </div>
                <div class="meta-item">
                    <span class="icon">🎓</span>
                    <span>${formatEducation(career.education_required)}</span>
                </div>
                <div class="meta-item">
                    <span class="icon">🏢</span>
                    <span>${career.work_styles.map(s => formatLabel(s)).join(', ')}</span>
                </div>
            </div>
            <div class="career-card-skills">
                <div class="skills-label">Your matching skills:</div>
                <div class="skill-tags">
                    ${matchingSkills.map(skill => `<span class="skill-tag match">${formatLabel(skill)}</span>`).join('')}
                    ${matchingSkills.length === 0 ? '<span class="skill-tag">No matching skills yet</span>' : ''}
                </div>
                ${missingSkills.length > 0 ? `
                    <div class="skills-label" style="margin-top: 12px;">Skills to develop:</div>
                    <div class="skill-tags">
                        ${missingSkills.map(skill => `<span class="skill-tag missing">${formatLabel(skill)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="view-details">View Career Details <span>→</span></div>
        `;
       
        card.addEventListener('click', () => showCareerModal(career));
       
        return card;
    }
   
    function showCareerModal(career) {
        const matchingSkills = career.skill_gaps.matching;
        const missingRequired = career.skill_gaps.missing_required;
        const missingPreferred = career.skill_gaps.missing_preferred;
       
        modalBody.innerHTML = `
            <div class="modal-header">
                <h2>${career.title}</h2>
                <span class="industry-badge">${career.industry}</span>
            </div>
           
            <div class="modal-section">
                <h4>📋 About This Career</h4>
                <p>${career.description}</p>
            </div>
           
            <div class="modal-section">
                <h4>📊 Quick Facts</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="label">Salary Range</div>
                        <div class="value">${formatSalaryINR(career.salary_range.min)} - ${formatSalaryINR(career.salary_range.max)}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Growth Outlook</div>
                        <div class="value">${career.growth_outlook}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Education Required</div>
                        <div class="value">${formatEducation(career.education_required)}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Work Styles</div>
                        <div class="value">${career.work_styles.map(s => formatLabel(s)).join(', ')}</div>
                    </div>
                </div>
            </div>
           
            <div class="modal-section">
                <h4>🎯 Match Analysis</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="label">Overall Match</div>
                        <div class="value">${career.match_percentage}%</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Skill Match</div>
                        <div class="value">${Math.round(career.score_breakdown.skill_match)}%</div>
                    </div>
                </div>
            </div>
           
            <div class="modal-section">
                <h4>✅ Your Matching Skills</h4>
                <div class="skill-tags">
                    ${matchingSkills.map(skill => `<span class="skill-tag match">${formatLabel(skill)}</span>`).join('') || '<span class="skill-tag">No matching skills yet</span>'}
                </div>
            </div>
           
            ${missingRequired.length > 0 ? `
                <div class="modal-section">
                    <h4>📚 Required Skills to Develop</h4>
                    <div class="skill-tags">
                        ${missingRequired.map(skill => `<span class="skill-tag missing">${formatLabel(skill)}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
           
            ${missingPreferred.length > 0 ? `
                <div class="modal-section">
                    <h4>⭐ Nice-to-Have Skills</h4>
                    <div class="skill-tags">
                        ${missingPreferred.map(skill => `<span class="skill-tag">${formatLabel(skill)}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
           
            <div class="modal-section">
                <h4>🚀 Typical Career Path</h4>
                <div class="career-path-timeline">
                    ${career.career_path.map((step, i) => `
                        <span class="career-path-step">${step}</span>
                        ${i < career.career_path.length - 1 ? '<span class="career-path-arrow">→</span>' : ''}
                    `).join('')}
                </div>
            </div>
        `;
       
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
   
    function formatEducation(level) {
        const mapping = {
            'high_school': 'High School',
            'vocational': 'Vocational/Trade',
            'certification': 'Certification',
            'associates': "Associate's",
            'bachelors': "Bachelor's",
            'masters': "Master's",
            'doctorate': 'Doctorate'
        };
        return mapping[level] || level;
    }
   
    function formatLabel(str) {
        return str.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
   
    function formatSalaryINR(usdAmount) {
        const exchangeRate = 85;
        const inrAmount = usdAmount * exchangeRate;
       
        if (inrAmount >= 10000000) {
            return '₹' + (inrAmount / 10000000).toFixed(1) + ' Cr';
        } else if (inrAmount >= 100000) {
            return '₹' + (inrAmount / 100000).toFixed(1) + ' L';
        } else {
            return '₹' + inrAmount.toLocaleString('en-IN');
        }
    }
   
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
   
    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
   
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
});
