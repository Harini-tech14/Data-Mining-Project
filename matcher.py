import pandas as pd
from data.careers import CAREERS_DATABASE, SKILLS_DATABASE, INTERESTS_DATABASE, INDUSTRIES_DATABASE, EDUCATION_LEVELS

class CareerMatcher:
    def __init__(self):
        self.careers_df = pd.DataFrame(CAREERS_DATABASE)
        self.skills = SKILLS_DATABASE
        self.interests = INTERESTS_DATABASE
        self.industries = INDUSTRIES_DATABASE
        self.education_levels = EDUCATION_LEVELS
    
    def get_all_skills(self):
        """Return all skills organized by category"""
        return self.skills
    
    def get_all_interests(self):
        """Return all interests"""
        return self.interests
    
    def get_all_industries(self):
        """Return all industries"""
        return self.industries
    
    def get_career_by_id(self, career_id):
        """Get career details by ID"""
        career = self.careers_df[self.careers_df['id'] == career_id]
        if len(career) > 0:
            return career.iloc[0].to_dict()
        return None
    
    def calculate_skill_match(self, user_skills, career):
        """Calculate skill match score"""
        required_skills = set(career['required_skills'])
        preferred_skills = set(career.get('preferred_skills', []))
        user_skills_set = set(user_skills)
        
        required_match = len(user_skills_set & required_skills)
        required_total = len(required_skills)
        
        preferred_match = len(user_skills_set & preferred_skills)
        preferred_total = len(preferred_skills) if preferred_skills else 1
        
        required_score = (required_match / required_total) * 60 if required_total > 0 else 0
        preferred_score = (preferred_match / preferred_total) * 20 if preferred_total > 0 else 0
        
        return required_score + preferred_score
    
    def calculate_interest_match(self, user_interests, career):
        """Calculate interest match score"""
        career_interests = set(career.get('interests', []))
        user_interests_set = set(user_interests)
        
        if not career_interests:
            return 0
        
        match_count = len(user_interests_set & career_interests)
        return (match_count / len(career_interests)) * 20
    
    def calculate_education_match(self, user_education, career):
        """Calculate education compatibility score"""
        user_level = self.education_levels.get(user_education, 4)
        required_level = self.education_levels.get(career['education_level'], 4)
        
        if user_level >= required_level:
            return 10
        elif user_level == required_level - 1:
            return 5
        else:
            return 0
    
    def calculate_experience_match(self, user_experience, career):
        """Calculate experience fit score"""
        exp_range = career.get('experience_range', {'min': 0, 'max': 20})
        min_exp = exp_range['min']
        max_exp = exp_range['max']
        
        if min_exp <= user_experience <= max_exp:
            return 10
        elif user_experience < min_exp:
            diff = min_exp - user_experience
            return max(0, 10 - diff * 2)
        else:
            return 8
    
    def calculate_industry_match(self, preferred_industries, career):
        """Calculate industry preference match"""
        if not preferred_industries:
            return 5
        
        career_industry = career.get('industry', '')
        if career_industry in preferred_industries:
            return 10
        return 2
    
    def calculate_work_style_match(self, user_work_style, career):
        """Calculate work style compatibility"""
        career_styles = career.get('work_styles', [])
        if user_work_style in career_styles:
            return 10
        return 3
    
    def calculate_salary_match(self, salary_expectation, career):
        """Calculate salary expectation match"""
        salary_category = career.get('salary_category', 'medium')
        
        mapping = {
            'low': ['medium', 'high'],
            'medium': ['medium', 'high'],
            'high': ['high']
        }
        
        expected_categories = mapping.get(salary_expectation, ['medium'])
        if salary_category in expected_categories:
            return 10
        return 4
    
    def calculate_total_score(self, user_profile, career):
        """Calculate total match score for a career"""
        scores = {
            'skill_match': self.calculate_skill_match(user_profile['skills'], career),
            'interest_match': self.calculate_interest_match(user_profile['interests'], career),
            'education_match': self.calculate_education_match(user_profile['education_level'], career),
            'experience_match': self.calculate_experience_match(user_profile['experience_years'], career),
            'industry_match': self.calculate_industry_match(user_profile['preferred_industries'], career),
            'work_style_match': self.calculate_work_style_match(user_profile['work_style'], career),
            'salary_match': self.calculate_salary_match(user_profile['salary_expectation'], career)
        }
        
        total_score = sum(scores.values())
        return total_score, scores
    
    def get_skill_gaps(self, user_skills, career):
        """Identify skills the user needs to develop"""
        required_skills = set(career['required_skills'])
        preferred_skills = set(career.get('preferred_skills', []))
        user_skills_set = set(user_skills)
        
        missing_required = list(required_skills - user_skills_set)
        missing_preferred = list(preferred_skills - user_skills_set)
        matching_skills = list(user_skills_set & (required_skills | preferred_skills))
        
        return {
            'matching': matching_skills,
            'missing_required': missing_required,
            'missing_preferred': missing_preferred
        }
    
    def get_recommendations(self, user_profile, top_n=8):
        """Get top career recommendations for a user profile"""
        recommendations = []
        
        for _, career in self.careers_df.iterrows():
            career_dict = career.to_dict()
            total_score, score_breakdown = self.calculate_total_score(user_profile, career_dict)
            skill_gaps = self.get_skill_gaps(user_profile['skills'], career_dict)
            
            match_percentage = min(100, round(total_score))
            
            recommendation = {
                'id': career_dict['id'],
                'title': career_dict['title'],
                'description': career_dict['description'],
                'industry': career_dict['industry'],
                'match_percentage': match_percentage,
                'score_breakdown': score_breakdown,
                'skill_gaps': skill_gaps,
                'salary_range': career_dict['salary_range'],
                'growth_outlook': career_dict['growth_outlook'],
                'education_required': career_dict['education_level'],
                'work_styles': career_dict['work_styles'],
                'career_path': career_dict['career_path']
            }
            
            recommendations.append(recommendation)
        
        recommendations.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        return recommendations[:top_n]
