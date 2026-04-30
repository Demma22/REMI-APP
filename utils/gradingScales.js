// utils/gradingScales.js

export const GRADING_SCALES = {
  uganda: {
    id: 'uganda',
    name: 'Uganda (NCHE 5.0)',
    country: 'Uganda',
    scale: 5.0,
    description: 'National Council for Higher Education Uganda',
    getGradePoint: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 0;
      if (numericMarks >= 80) return 5.0;
      if (numericMarks >= 75) return 4.5;
      if (numericMarks >= 70) return 4.0;
      if (numericMarks >= 65) return 3.5;
      if (numericMarks >= 60) return 3.0;
      if (numericMarks >= 55) return 2.5;
      if (numericMarks >= 50) return 2.0;
      return 0.0;
    },
    getGradeLetter: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 'F';
      if (numericMarks >= 80) return 'A';
      if (numericMarks >= 75) return 'A-';
      if (numericMarks >= 70) return 'B+';
      if (numericMarks >= 65) return 'B';
      if (numericMarks >= 60) return 'B-';
      if (numericMarks >= 55) return 'C+';
      if (numericMarks >= 50) return 'C';
      return 'F';
    },
    getClassification: (gpa) => {
      if (gpa >= 4.5) return 'First Class Honors';
      if (gpa >= 4.0) return 'Second Class Upper';
      if (gpa >= 3.5) return 'Second Class Lower';
      if (gpa >= 2.0) return 'Pass';
      return 'Fail';
    }
  },
  
  kenya: {
    id: 'kenya',
    name: 'Kenya (CBC 12.0)',
    country: 'Kenya',
    scale: 12.0,
    description: 'Competency Based Curriculum',
    getGradePoint: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 0;
      if (numericMarks >= 87) return 12;
      if (numericMarks >= 80) return 11;
      if (numericMarks >= 75) return 10;
      if (numericMarks >= 70) return 9;
      if (numericMarks >= 65) return 8;
      if (numericMarks >= 60) return 7;
      if (numericMarks >= 55) return 6;
      if (numericMarks >= 50) return 5;
      if (numericMarks >= 45) return 4;
      if (numericMarks >= 40) return 3;
      return 0;
    },
    getGradeLetter: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 'E';
      if (numericMarks >= 87) return 'A';
      if (numericMarks >= 80) return 'A-';
      if (numericMarks >= 75) return 'B+';
      if (numericMarks >= 70) return 'B';
      if (numericMarks >= 65) return 'B-';
      if (numericMarks >= 60) return 'C+';
      if (numericMarks >= 55) return 'C';
      if (numericMarks >= 50) return 'C-';
      if (numericMarks >= 45) return 'D+';
      if (numericMarks >= 40) return 'D';
      return 'E';
    },
    getClassification: (gpa) => {
      if (gpa >= 10) return 'Distinction';
      if (gpa >= 8) return 'Credit';
      if (gpa >= 6) return 'Pass';
      return 'Fail';
    }
  },
  
  tanzania: {
    id: 'tanzania',
    name: 'Tanzania (NECTA)',
    country: 'Tanzania',
    scale: 5.0,
    description: 'National Examinations Council of Tanzania',
    getGradePoint: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 0;
      if (numericMarks >= 80) return 5.0;
      if (numericMarks >= 75) return 4.5;
      if (numericMarks >= 70) return 4.0;
      if (numericMarks >= 65) return 3.5;
      if (numericMarks >= 60) return 3.0;
      if (numericMarks >= 55) return 2.5;
      if (numericMarks >= 50) return 2.0;
      if (numericMarks >= 45) return 1.5;
      if (numericMarks >= 40) return 1.0;
      return 0;
    },
    getGradeLetter: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 'F';
      if (numericMarks >= 80) return 'A';
      if (numericMarks >= 75) return 'B+';
      if (numericMarks >= 70) return 'B';
      if (numericMarks >= 65) return 'C+';
      if (numericMarks >= 60) return 'C';
      if (numericMarks >= 55) return 'D+';
      if (numericMarks >= 50) return 'D';
      if (numericMarks >= 45) return 'E';
      return 'F';
    },
    getClassification: (gpa) => {
      if (gpa >= 4.5) return 'First Class';
      if (gpa >= 3.5) return 'Second Class Upper';
      if (gpa >= 2.5) return 'Second Class Lower';
      if (gpa >= 1.5) return 'Pass';
      return 'Fail';
    }
  },
  
  nigeria: {
    id: 'nigeria',
    name: 'Nigeria (NUC 5.0)',
    country: 'Nigeria',
    scale: 5.0,
    description: 'National Universities Commission',
    getGradePoint: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 0;
      if (numericMarks >= 70) return 5.0;
      if (numericMarks >= 60) return 4.0;
      if (numericMarks >= 50) return 3.0;
      if (numericMarks >= 45) return 2.0;
      return 0;
    },
    getGradeLetter: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 'F';
      if (numericMarks >= 70) return 'A';
      if (numericMarks >= 60) return 'B';
      if (numericMarks >= 50) return 'C';
      if (numericMarks >= 45) return 'D';
      return 'F';
    },
    getClassification: (gpa) => {
      if (gpa >= 4.5) return 'First Class';
      if (gpa >= 3.5) return 'Second Class Upper';
      if (gpa >= 2.5) return 'Second Class Lower';
      if (gpa >= 1.5) return 'Pass';
      return 'Fail';
    }
  },
  
  usa: {
    id: 'usa',
    name: 'USA (4.0 Scale)',
    country: 'USA',
    scale: 4.0,
    description: 'Standard US 4.0 GPA System',
    getGradePoint: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 0;
      if (numericMarks >= 90) return 4.0;
      if (numericMarks >= 80) return 3.0;
      if (numericMarks >= 70) return 2.0;
      if (numericMarks >= 60) return 1.0;
      return 0;
    },
    getGradeLetter: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 'F';
      if (numericMarks >= 90) return 'A';
      if (numericMarks >= 80) return 'B';
      if (numericMarks >= 70) return 'C';
      if (numericMarks >= 60) return 'D';
      return 'F';
    },
    getClassification: (gpa) => {
      if (gpa >= 3.8) return 'Summa Cum Laude';
      if (gpa >= 3.5) return 'Magna Cum Laude';
      if (gpa >= 3.0) return 'Cum Laude';
      return 'Pass';
    }
  },
  
  uk: {
    id: 'uk',
    name: 'UK (Classification)',
    country: 'UK',
    scale: 'classification',
    description: 'UK Degree Classification',
    getGradePoint: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 0;
      if (numericMarks >= 70) return 4.0;
      if (numericMarks >= 60) return 3.0;
      if (numericMarks >= 50) return 2.0;
      if (numericMarks >= 40) return 1.0;
      return 0;
    },
    getGradeLetter: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 'Fail';
      if (numericMarks >= 70) return 'First Class';
      if (numericMarks >= 60) return 'Upper Second (2:1)';
      if (numericMarks >= 50) return 'Lower Second (2:2)';
      if (numericMarks >= 40) return 'Third Class';
      return 'Fail';
    },
    getClassification: (gpa) => {
      if (gpa >= 3.7) return 'First Class Honours';
      if (gpa >= 3.0) return 'Upper Second Class Honours';
      if (gpa >= 2.0) return 'Lower Second Class Honours';
      if (gpa >= 1.0) return 'Third Class Honours';
      return 'Fail';
    }
  },
  
  india: {
    id: 'india',
    name: 'India (Percentage/CGPA)',
    country: 'India',
    scale: 10.0,
    description: 'Indian CGPA System (10-point scale)',
    getGradePoint: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 0;
      return (numericMarks / 10).toFixed(1);
    },
    getGradeLetter: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 'F';
      if (numericMarks >= 90) return 'O (Outstanding)';
      if (numericMarks >= 80) return 'A+ (Excellent)';
      if (numericMarks >= 70) return 'A (Very Good)';
      if (numericMarks >= 60) return 'B+ (Good)';
      if (numericMarks >= 50) return 'B (Average)';
      if (numericMarks >= 40) return 'C (Pass)';
      return 'F (Fail)';
    },
    getClassification: (gpa) => {
      if (gpa >= 9.0) return 'Distinction';
      if (gpa >= 8.0) return 'First Division';
      if (gpa >= 7.0) return 'Second Division';
      if (gpa >= 6.0) return 'Third Division';
      return 'Fail';
    }
  },
  
  southAfrica: {
    id: 'southAfrica',
    name: 'South Africa (NQF)',
    country: 'South Africa',
    scale: 100,
    description: 'National Qualifications Framework',
    getGradePoint: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 0;
      if (numericMarks >= 75) return 80;
      if (numericMarks >= 70) return 75;
      if (numericMarks >= 60) return 70;
      if (numericMarks >= 50) return 60;
      if (numericMarks >= 40) return 50;
      return 0;
    },
    getGradeLetter: (marks) => {
      const numericMarks = parseFloat(marks);
      if (isNaN(numericMarks)) return 'F';
      if (numericMarks >= 75) return 'A (Distinction)';
      if (numericMarks >= 70) return 'B (Merit)';
      if (numericMarks >= 60) return 'C (Good)';
      if (numericMarks >= 50) return 'D (Pass)';
      if (numericMarks >= 40) return 'E (Supplemental)';
      return 'F (Fail)';
    },
    getClassification: (gpa) => {
      if (gpa >= 75) return 'First Class';
      if (gpa >= 70) return 'Second Class Upper';
      if (gpa >= 60) return 'Second Class Lower';
      if (gpa >= 50) return 'Pass';
      return 'Fail';
    }
  }
};

// Get all countries for selector
export const getAllCountries = () => {
  return Object.values(GRADING_SCALES).map(scale => ({
    id: scale.id,
    name: scale.name,
    country: scale.country
  }));
};

// Get grading scale by ID
export const getGradingScale = (id) => {
  return GRADING_SCALES[id] || GRADING_SCALES.uganda;
};

// Save user's selected curriculum
export const saveUserCurriculum = async (db, userId, curriculumId) => {
  const userDocRef = doc(db, "users", userId);
  await setDoc(userDocRef, { 
    selected_curriculum: curriculumId,
    grading_scale: getGradingScale(curriculumId)
  }, { merge: true });
};

// Get user's curriculum
export const getUserCurriculum = async (db, userId) => {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    const data = userDoc.data();
    return data.selected_curriculum || 'uganda';
  }
  return 'uganda';
};