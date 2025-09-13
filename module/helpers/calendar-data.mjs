export const HYP3E_CALENDAR = {
  years: [
    { num: 1, name: "Bear", alt: "Genesis", season: "Winter" },
    { num: 1, name: "Fish", alt: "Renaissance", season: "Winter|Spring" },
    { num: 1, name: "Wolf", alt: "Vernal Equinox", season: "Spring" },
    { num: 1, name: "Hare", alt: "Tempest", season: "Spring" },
    { num: 1, name: "Elk", alt: "Deluge", season: "Summer" },
    { num: 1, name: "Tiger", alt: "High Summer Waxing", season: "Summer" },
    { num: 1, name: "Crab", alt: "High Summer Waning", season: "Summer" },
    { num: 1, name: "Eagle", alt: "Drought", season: "Summer" },
    { num: 1, name: "Whale", alt: "Tranquility", season: "Fall" },
    { num: 1, name: "Aurochs", alt: "Autumnal Equinox", season: "Fall" },
    { num: 1, name: "Mammoth", alt: "Twilight", season: "Fall|Winter" },
    { num: 1, name: "Fox", alt: "Coda", season: "Winter" },
    { num: 1, name: "Bat", alt: "Nightfall", season: "Winter" },
  ],
  months: [
    { 
        num: 1, name: "Aries", 
        festivals: { name:"Apollonalia", startDay: 1, endDay: 7 }, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waxing Gibbous", 4: "Full", 5: "Waning Gibbous", 15: "Third Quarter", 16: "Waning Crescent", 27: "New", 28: "Waxing Crescent"} 
        } 
    },
    { 
        num: 2, name: "Taurus", 
        festivals: {}, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waxing Crescent", 10: "First Quarter", 11: "Waxing Gibbous", 21: "Full", 22: "Waning Gibbous" } 
        } 
    },
    { 
        num: 3, name: "Gemini", 
        festivals: {}, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waning Gibbous", 4: "Third Quarter", 5: "Waning Crescent", 16: "New", 17: "Waxing Crescent", 27: "First Quarter", 28: "Waxing Gibbous" } 
        } 
    },
    { 
        num: 4, name: "Cancer", 
        festivals: { name:"Saturnalia", startDay: 8, endDay: 14 }, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waxing Gibbous", 11: "Full", 12: "Waning Gibbous", 22: "Third Quarter", 23: "Waning Crescent" } 
        } 
    },
    { 
        num: 5, name: "Leo", 
        festivals: {}, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waning Crescent", 6: "New", 7: "Waxing Crescent", 17: "First Quarter", 18: "Waxing Gibbous", 28: "Full" } 
        } 
    },
    { 
        num: 6, name: "Virgo", 
        festivals: {}, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waning Gibbous", 11: "Third Quarter", 12: "Waning Crescent", 23: "New", 24: "Waxing Crescent" } 
        } 
    },
    { 
        num: 7, name: "Libra", 
        festivals: { name:"Bealltainn", startDay: 15, endDay: 21 }, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waxing Crescent", 6: "First Quarter", 7: "Waxing Gibbous", 18: "Full", 19: "Waning Gibbous" } 
        } 
    },
    { 
        num: 8, name: "Scorpius", 
        festivals: {}, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Third Quarter", 2: "Waning Crescent", 13: "New", 14: "Waxing Crescent", 24: "First Quarter", 25: "Waxing Gibbous" } 
        } 
    },
    { 
        num: 9, name: "Ophiuchus", 
        festivals: {}, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waxing Gibbous", 7: "Full", 8: "Waning Gibbous", 18: "Third Quarter", 19: "Waning Crescent" } 
        } 
    },
    { 
        num: 10, name: "Sagittarius", 
        festivals: { name:"Plutonia", startDay: 22, endDay: 28 }, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waning Crescent", 2: "New", 3: "Waxing Crescent", 13: "First Quarter", 14: "Waxing Gibbous", 25: "Full", 26: "Waning Gibbous" } 
        } 
    },
    { 
        num: 11, name: "Capricorn", 
        festivals: {}, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waning Gibbous", 8: "Third Quarter", 9: "Waning Crescent", 20: "New", 21: "Waxing Crescent" } 
        } 
    },
    { 
        num: 12, name: "Aquarius", 
        festivals: {}, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waxing Crescent", 3: "First Quarter", 4: "Waxing Gibbous", 14: "Full", 15: "Waning Gibbous", 25: "Third Quarter", 26: "Waning Crescent" } 
        } 
    },
    { 
        num: 13, name: "Pisces", 
        festivals: {}, 
        moonPhases: { 
            Phobos: { 1: "Waxing", 4: "Full", 5: "Waning", 7: "New", 8: "Waxing", 11: "Full", 12: "Waning", 14: "New", 15: "Waxing", 18: "Full", 19: "Waning", 21: "New", 22: "Waxing", 25: "Full", 26: "Waning", 28: "New" }, 
            Selene: { 1: "Waning Crescent", 9: "New", 10: "Waxing Crescent", 20: "First Quarter", 21: "Waxing Gibbous" } 
        } 
    },
  ],
  weekdays: ["Sun", "Earth", "Sea", "Moon", "Star", "Sky", "Saturn"]
};
