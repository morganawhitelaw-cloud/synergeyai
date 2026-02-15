const { generateAISolution } = require('../js/ai-solution.js');

describe('generateAISolution', () => {
    test('should return Authentication & SSO solution', () => {
        const story = {
            Feature: 'Login',
            User_Story: 'As a user I want to sign in',
            Scenario: 'User enters credentials',
            Acceptance_Criteria: 'User is authenticated'
        };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('OAuth 2.0');
        expect(result.solutions).toContain('Implement OAuth 2.0/OIDC flow with Capital Edge SSO provider.');
    });

    test('should return Session Management solution', () => {
        const story = { User_Story: 'maintain session timeout' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('Redis');
        expect(result.solutions).toContain('Implement server-side session management with Redis for scalability.');
    });

    test('should return Project Creation solution', () => {
        const story = { User_Story: 'create new project wizard' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('React Forms');
        expect(result.solutions).toContain('Build multi-step wizard component with form state management.');
    });

    test('should return Data Upload & Processing solution', () => {
        const story = { User_Story: 'upload csv file' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('File Upload API');
        expect(result.solutions).toContain('Implement chunked file upload for large files with progress indicator.');
    });

    test('should return Dashboard & Visualization solution', () => {
        const story = { User_Story: 'view dashboard charts' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('Chart.js/D3.js');
        expect(result.solutions).toContain('Implement responsive dashboard with configurable widgets.');
    });

    test('should return API Integration solution', () => {
        const story = { User_Story: 'integrate with external api' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('REST/GraphQL');
        expect(result.solutions).toContain('Create abstraction layer for external API integrations.');
    });

    test('should return Taxonomy & Classification solution', () => {
        const story = { User_Story: 'taxonomy mapping' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('Mapping Engine');
        expect(result.solutions).toContain('Build configurable mapping rules engine with UI editor.');
    });

    test('should return Data Validation solution', () => {
        const story = { User_Story: 'verify data accuracy' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('Validation Framework');
        expect(result.solutions).toContain('Implement multi-level validation (format, business rules, cross-field).');
    });

    test('should return Calculation & Analysis solution', () => {
        const story = { User_Story: 'calculate headcount analysis' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('Calculation Engine');
        expect(result.solutions).toContain('Build modular calculation engine with configurable formulas.');
    });

    test('should return Currency & Conversion solution', () => {
        const story = { User_Story: 'currency conversion' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('Currency API');
        expect(result.solutions).toContain('Integrate with reliable exchange rate API (e.g., Open Exchange Rates).');
    });

    test('should return Export & Deliverables solution', () => {
        const story = { User_Story: 'export report' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('Export Engine');
        expect(result.solutions).toContain('Implement template-based document generation (e.g., docxtemplater).');
    });

    test('should return Default suggestions when no keywords match', () => {
        const story = { User_Story: 'just a simple button click' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('React');
        expect(result.solutions).toContain('Implement clean component architecture following atomic design principles.');
    });

    test('should handle empty input gracefully', () => {
        const story = {};
        const result = generateAISolution(story);
        expect(result.techStack).toContain('React'); // Default
    });

    test('should be case insensitive', () => {
        const story = { User_Story: 'LOGIN' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('OAuth 2.0');
    });

    test('should combine fields for matching', () => {
        const story = { Feature: 'SSO', User_Story: 'nothing' };
        const result = generateAISolution(story);
        expect(result.techStack).toContain('OAuth 2.0');
    });
});
