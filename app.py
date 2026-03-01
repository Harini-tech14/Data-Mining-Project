from flask import Flask, render_template, request, jsonify
import os
from services.matcher import CareerMatcher

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

if not app.secret_key:
    raise RuntimeError("SESSION_SECRET environment variable is required")

matcher = CareerMatcher()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/skills', methods=['GET'])
def get_skills():
    """Return all available skills for the questionnaire"""
    return jsonify(matcher.get_all_skills())


@app.route('/api/interests', methods=['GET'])
def get_interests():
    """Return all available interests for the questionnaire"""
    return jsonify(matcher.get_all_interests())


@app.route('/api/industries', methods=['GET'])
def get_industries():
    """Return all available industries"""
    return jsonify(matcher.get_all_industries())


@app.route('/api/recommend', methods=['POST'])
def recommend_careers():
    """Get career recommendations based on user profile"""
    data = request.json

    user_profile = {
        'skills': data.get('skills', []),
        'interests': data.get('interests', []),
        'education_level': data.get('education_level', 'bachelors'),
        'experience_years': data.get('experience_years', 0),
        'preferred_industries': data.get('preferred_industries', []),
        'work_style': data.get('work_style', 'hybrid'),
        'salary_expectation': data.get('salary_expectation', 'medium')
    }

    recommendations = matcher.get_recommendations(user_profile, top_n=8)
    return jsonify(recommendations)


@app.route('/api/career/<career_id>', methods=['GET'])
def get_career_details(career_id):
    """Get detailed information about a specific career"""
    career = matcher.get_career_by_id(career_id)
    if career:
        return jsonify(career)
    return jsonify({'error': 'Career not found'}), 404


@app.route('/results')
def results():
    return render_template('results.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
