// utils/funNotifications.js

// Fallback notifications (in case no admin notifications exist)
export const fallbackNotifications = [
  {
    title: "💪 You've Got This!",
    body: "Every expert was once a beginner. Keep pushing!",
    category: "motivation"
  },
  {
    title: "📚 Study Break!",
    body: "Take 5 minutes to stretch and hydrate!",
    category: "wellness"
  },
  {
    title: "😂 Procrastination Alert!",
    body: "That assignment isn't going to write itself!",
    category: "fun"
  },
  {
    title: "☕ Coffee Time!",
    body: "Your brain runs on caffeine. Go grab a cup!",
    category: "fun"
  },
  {
    title: "🧠 Brain Fuel Needed",
    body: "When was the last time you ate? Your brain needs energy!",
    category: "wellness"
  },
  {
    title: "🎯 Focus Mode",
    body: "Put your phone on silent and crush those assignments!",
    category: "productivity"
  }
];

// Get random fallback notification
export const getRandomFallbackNotification = () => {
  const randomIndex = Math.floor(Math.random() * fallbackNotifications.length);
  return fallbackNotifications[randomIndex];
};

// HARDCODED HOLIDAY NOTIFICATIONS (only on specific dates)
export const getHolidayNotification = () => {
  const today = new Date();
  const month = today.getMonth();
  const day = today.getDate();
  const year = today.getFullYear();
  
  // Function to calculate Easter date (accurate formula)
  const getEasterDate = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
    const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
    return { month: easterMonth - 1, day: easterDay }; // month is 0-indexed
  };
  
  // Christmas
  if (month === 11 && day === 25) {
    return {
      type: "christmas",
      notification: {
        title: "🎄 Merry Christmas!",
        body: "Wishing you joy, peace, and well-deserved rest!",
        category: "holiday"
      }
    };
  }
  
  // New Year
  if (month === 0 && day === 1) {
    return {
      type: "newyear",
      notification: {
        title: "🎉 Happy New Year!",
        body: "New year, new opportunities! Make it count!",
        category: "holiday"
      }
    };
  }
  
  // Valentine's Day
  if (month === 1 && day === 14) {
    return {
      type: "valentines",
      notification: {
        title: "❤️ Happy Valentine's Day!",
        body: "Don't forget to treat yourself! Self-love is the best love!",
        category: "holiday"
      }
    };
  }
  
  // Easter (dynamic date)
  const easter = getEasterDate(year);
  if (month === easter.month && day === easter.day) {
    return {
      type: "easter",
      notification: {
        title: "🐣 Happy Easter!",
        body: "Enjoy the holiday! Time for family and rest!",
        category: "holiday"
      }
    };
  }
  
  // Halloween
  if (month === 9 && day === 31) {
    return {
      type: "halloween",
      notification: {
        title: "🎃 Happy Halloween!",
        body: "The only scary thing should be your deadlines!",
        category: "holiday"
      }
    };
  }
  
  // Thanksgiving (4th Thursday of November)
  if (month === 10) {
    const thanksgivingDay = (() => {
      const first = new Date(year, 10, 1);
      const firstThursday = first.getDay() <= 4 ? (4 - first.getDay() + 1) : (11 - first.getDay());
      return firstThursday + 21; // 4th Thursday
    })();
    if (day === thanksgivingDay) {
      return {
        type: "thanksgiving",
        notification: {
          title: "🦃 Happy Thanksgiving!",
          body: "Thankful for you and your hard work! Enjoy the break!",
          category: "holiday"
        }
      };
    }
  }
  
  return null;
};