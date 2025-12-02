// Client-side Data Management System
// This replaces backend PHP/MySQL functionality with localStorage

class DataManager {
    constructor() {
        this.initializeData();
    }

    // Initialize data if it doesn't exist
    initializeData() {
        if (!localStorage.getItem('localIssues_initialized')) {
            this.resetToDefaultData();
            localStorage.setItem('localIssues_initialized', 'true');
        }
    }

    // Reset to default sample data
    resetToDefaultData() {
        const defaultIssues = [
            {
                id: 1,
                title: 'Large pothole on Main Street',
                category: 'pothole',
                status: 'open',
                name: 'Alice',
                email: 'alice123@gmail.com',
                phone: '+91 1234567895',
                address: 'uppalli Main Street,chikkamagaluru,karnataka',
                description: 'There is a large pothole that has formed on Main Street, right near the super market. The pothole is approximately 2 feet wide and 6 inches deep, causing significant damage to vehicles that drive over it. Multiple residents have reported tire damage, and it poses a safety hazard, especially during nighttime when visibility is poor.',
                photo_path: null,
                created_at: '2025-01-15T12:20:00Z',
                updated_at: '2025-01-15T12:20:30Z'
            },
            {
                id: 2,
                title: 'Street light malfunction on vijaypura',
                category: 'streetlight',
                status: 'in_progress',
                name: 'Bob joh',
                email: 'bob.joh@gmail.com',
                phone: '+91 234567896',
                address: 'vaijayapura main road,opposite of 7th heaven,chikkamagaluru',
                description: 'The street light in front of the 7th heaven in vijayapura has been malfunctioning for the past 3 weeks. It flickers intermittently and sometimes goes completely dark, creating safety concerns for pedestrians and drivers, especially during evening hours.',
                photo_path: null,
                created_at: '2025-01-12T14:45:00Z',
                updated_at: '2025-01-16T09:20:00Z'
            },
            {
                id: 3,
                title: 'Irregular water supply affecting undedarsarahalli',
                category: 'water_supply',
                status: 'open',
                name: 'aisahwarya bhat',
                email: 'aishwaryabhat@gmail.com',
                phone: '+91 234567897',
                address: 'undedasarahalli and surrounding area',
                description: 'Residents on undedasarahalli and the surrounding blocks have been experiencing irregular water supply for the past week. Water pressure is very low during morning hours (6-10 AM) and completely cuts off in the evenings (7-9 PM). This is affecting daily activities and has become a major inconvenience for families in the area.',
                photo_path: null,
                created_at: '2025-03-10T6:15:00Z',
                updated_at: '2025-03-10T6:15:05Z'
            },
            {
                id: 4,
                title: 'Illegal garbage dumping in dantarmukhi',
                category: 'garbage',
                status: 'resolved',
                name: 'raju gowda',
                email: 'rajugowda@gmail.com',
                phone: '+91 234567898',
                address: 'dantaramukhi lake,chikkamagaluru',
                description: 'There has been ongoing illegal garbage dumping in the vacant lot near dantaramukhi lake. Large items including furniture, appliances, and construction debris have been dumped there regularly. This has attracted pests and creates an unsightly and unhealthy environment for the surrounding businesses and residents.',
                photo_path: null,
                created_at: '2025-01-08T16:20:00Z',
                updated_at: '2025-01-17T11:30:00Z'
            },
            {
                id: 5,
                title: 'Bus stop damage in AIT circle',
                category: 'public_transport',
                status: 'open',
                name: 'rama shetty',
                email: 'ramashetty@gmail.com',
                phone: '+91 234567899',
                address: 'AIT circle bus stop,chikkamagaluru',
                description: 'The bus stop near AIT circle has been severely damaged, likely due to recent storms. The roof is partially collapsed, the seating is broken, and there are sharp metal edges exposed. This poses a safety risk to commuters who use this heavily trafficked bus stop daily.',
                photo_path: null,
                created_at: '2025-05-14T12:10:00Z',
                updated_at: '2025-05-14T12:10:00Z'
            },
            {
                id: 6,
                title: 'Sidewalk cracks creating tripping hazard',
                category: 'sidewalk',
                status: 'in_progress',
                name: 'shreyas',
                email: 'shreyasputu@gmail.com',
                phone: null,
                address: 'kote Street sidewalk,chikkamagaluru',
                description: 'The sidewalk in kote has developed several large cracks and uneven surfaces that create significant tripping hazards. This is particularly dangerous for elderly residents and people with mobility issues who frequent this area to access the nearby medical center.',
                photo_path: null,
                created_at: '2025-07-11T09:45:00Z',
                updated_at: '2025-07-15T14:22:00Z'
            }
        ];

        const defaultVolunteers = [
            {
                id: 1,
                name: 'John',
                email: 'john@gmail.com',
                phone: '+91 234567890',
                skills: 'Plumbing, Electrical work, Basic construction',
                availability: 'Weekends',
                area: 'uppalli',
                created_at: '2025-01-10T10:00:00Z'
            },
            {
                id: 2,
                name: 'varun',
                email: 'varun@gmail.com',
                phone: '+91 234567891',
                skills: 'Community organizing, First aid, Event planning',
                availability: 'Evenings',
                area: 'kote',
                created_at: '2025-02-11T14:30:00Z'
            },
            {
                id: 3,
                name: 'anjali',
                email: 'anjali@gmail.com',
                phone: '+91 234567892',
                skills: 'Construction, Road maintenance, Heavy equipment operation',
                availability: 'Flexible hours',
                area: 'undedasarahalli',
                created_at: '2025-03-12T09:15:00Z'
            },
            {
                id: 4,
                name: 'mohammad',
                email: 'mohammad@gmail.com',
                phone: '+91 234567893',
                skills: 'Environmental cleanup, Teaching, Project coordination',
                availability: 'Weekdays',
                area: 'uppalli',
                created_at: '2025-04-13T16:45:00Z'
            },
            {
                id: 5,
                name: 'David',
                email: 'david@email.com',
                phone: '+91 234567894',
                skills: 'IT support, Website maintenance, Database management',
                availability: 'Remote work',
                area: 'All areas',
                created_at: '2025-05-14T11:20:00Z'
            },
            {
                id: 6,
                name: 'fathima',
                email: 'fathima@gmail.com',
                phone: '+91 234567900',
                skills: 'Legal assistance, Documentation, Advocacy',
                availability: 'Weekends',
                area: 'vijayapura',
                created_at: '2025-06-15T13:30:00Z'
            },
            {
                id: 7,
                name: 'jayamma',
                email: 'jayamma@gmail.com',
                phone: '+91 234567901',
                skills: 'Photography, Social media, Marketing',
                availability: 'Evenings',
                area: 'gowrikalwe',
                created_at: '2025-07-16T08:10:00Z'
            },
            {
                id: 8,
                name: 'babu',
                email: 'babu@gmail.com',
                phone: '+91 234567902',
                skills: 'Nursing, First aid, Health education',
                availability: 'Flexible hours',
                area: 'All areas',
                created_at: '2025-08-17T15:00:00Z'
            }
        ];

        this.setIssues(defaultIssues);
        this.setVolunteers(defaultVolunteers);
    }

    // Issues management
    getIssues() {
        const issues = localStorage.getItem('localIssues_issues');
        return issues ? JSON.parse(issues) : [];
    }

    setIssues(issues) {
        localStorage.setItem('localIssues_issues', JSON.stringify(issues));
    }

    addIssue(issueData) {
        const issues = this.getIssues();
        const newId = Math.max(...issues.map(i => i.id), 0) + 1;
        
        const newIssue = {
            id: newId,
            ...issueData,
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        issues.unshift(newIssue);
        this.setIssues(issues);
        return newIssue;
    }

    updateIssue(id, updates) {
        const issues = this.getIssues();
        const issueIndex = issues.findIndex(i => i.id === parseInt(id));
        
        if (issueIndex !== -1) {
            issues[issueIndex] = {
                ...issues[issueIndex],
                ...updates,
                updated_at: new Date().toISOString()
            };
            this.setIssues(issues);
            return issues[issueIndex];
        }
        return null;
    }

    getIssueById(id) {
        const issues = this.getIssues();
        return issues.find(i => i.id === parseInt(id));
    }

    // Volunteers management
    getVolunteers() {
        const volunteers = localStorage.getItem('localIssues_volunteers');
        return volunteers ? JSON.parse(volunteers) : [];
    }

    setVolunteers(volunteers) {
        localStorage.setItem('localIssues_volunteers', JSON.stringify(volunteers));
    }

    addVolunteer(volunteerData) {
        const volunteers = this.getVolunteers();
        const newId = Math.max(...volunteers.map(v => v.id), 0) + 1;
        
        const newVolunteer = {
            id: newId,
            ...volunteerData,
            created_at: new Date().toISOString()
        };

        volunteers.unshift(newVolunteer);
        this.setVolunteers(volunteers);
        return newVolunteer;
    }

    // Statistics
    getStatistics() {
        const issues = this.getIssues();
        const volunteers = this.getVolunteers();

        return {
            totalIssues: issues.length,
            openIssues: issues.filter(i => i.status === 'open').length,
            inProgressIssues: issues.filter(i => i.status === 'in_progress').length,
            resolvedIssues: issues.filter(i => i.status === 'resolved').length,
            activeVolunteers: volunteers.length
        };
    }

    // Admin authentication (client-side only for demo)
    authenticateAdmin(username, password) {
        // Simple client-side authentication for demo
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('localIssues_admin_session', 'true');
            return true;
        }
        return false;
    }

    isAdminAuthenticated() {
        return localStorage.getItem('localIssues_admin_session') === 'true';
    }

    logoutAdmin() {
        localStorage.removeItem('localIssues_admin_session');
    }

    // Data export functionality
    exportIssuesAsCSV() {
        const issues = this.getIssues();
        const headers = ['ID', 'Title', 'Category', 'Status', 'Reporter Name', 'Reporter Email', 'Address', 'Description', 'Created Date'];
        const csvRows = [headers.join(',')];
        
        issues.forEach(issue => {
            const row = [
                issue.id,
                `"${issue.title.replace(/"/g, '""')}"`,
                issue.category,
                issue.status,
                `"${issue.name.replace(/"/g, '""')}"`,
                issue.email,
                `"${issue.address.replace(/"/g, '""')}"`,
                `"${issue.description.replace(/"/g, '""')}"`,
                new Date(issue.created_at).toLocaleDateString()
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    exportVolunteersAsCSV() {
        const volunteers = this.getVolunteers();
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Skills', 'Availability', 'Area', 'Registered Date'];
        const csvRows = [headers.join(',')];
        
        volunteers.forEach(volunteer => {
            const row = [
                volunteer.id,
                `"${volunteer.name.replace(/"/g, '""')}"`,
                volunteer.email,
                volunteer.phone || '',
                `"${volunteer.skills.replace(/"/g, '""')}"`,
                volunteer.availability,
                volunteer.area,
                new Date(volunteer.created_at).toLocaleDateString()
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    // File download helper
    downloadFile(content, filename, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Clear all data (for testing)
    clearAllData() {
        localStorage.removeItem('localIssues_issues');
        localStorage.removeItem('localIssues_volunteers');
        localStorage.removeItem('localIssues_admin_session');
        localStorage.removeItem('localIssues_initialized');
    }
}

// Create global instance
window.dataManager = new DataManager();

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}

console.log('Data Manager initialized - Backend disconnected, using localStorage');