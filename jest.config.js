module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'tateti.js',
        '!node_modules/**'
    ],
    testMatch: [
        '**/*.test.js',
        '**/*.integration.test.js'
    ],
    verbose: true
};