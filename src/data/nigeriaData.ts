/**
 * Comprehensive Nigerian Administrative and Banking Reference Data
 * for Tinubu Movement Worldwide (TMW) Electoral Ward Registration
 */

export interface NigerianStateData {
  state: string;
  code: string;
  lgas: string[];
}

export const NIGERIAN_STATES_AND_LGAS: NigerianStateData[] = [
  {
    state: "Abia",
    code: "AB",
    lgas: [
      "Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano",
      "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa",
      "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West",
      "Umuahia North", "Umuahia South", "Umu Nneochi"
    ]
  },
  {
    state: "Adamawa",
    code: "AD",
    lgas: [
      "Demsa", "Fufore", "Ganye", "Girei", "Gombi", "Guyuk", "Hong",
      "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika",
      "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo",
      "Yola North", "Yola South"
    ]
  },
  {
    state: "Akwa Ibom",
    code: "AK",
    lgas: [
      "Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim",
      "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom",
      "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo",
      "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara",
      "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun",
      "Uruan", "Urue-Offong/Oruko", "Uyo"
    ]
  },
  {
    state: "Anambra",
    code: "AN",
    lgas: [
      "Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North",
      "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North",
      "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South",
      "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North",
      "Orumba South", "Oyi"
    ]
  },
  {
    state: "Bauchi",
    code: "BA",
    lgas: [
      "Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass",
      "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum",
      "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro",
      "Warji", "Zaki"
    ]
  },
  {
    state: "Bayelsa",
    code: "BY",
    lgas: [
      "Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia",
      "Sagbama", "Southern Ijaw", "Yenagoa"
    ]
  },
  {
    state: "Benue",
    code: "BN",
    lgas: [
      "Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East",
      "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo",
      "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu",
      "Otukpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"
    ]
  },
  {
    state: "Borno",
    code: "BO",
    lgas: [
      "Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa",
      "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga",
      "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa",
      "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala",
      "Nganzai", "Shani"
    ]
  },
  {
    state: "Cross River",
    code: "CR",
    lgas: [
      "Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase",
      "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom",
      "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"
    ]
  },
  {
    state: "Delta",
    code: "DE",
    lgas: [
      "Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East",
      "Ethiope West", "Ika North East", "Ika South", "Isoko North",
      "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North",
      "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North",
      "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South",
      "Warri South West"
    ]
  },
  {
    state: "Ebonyi",
    code: "EB",
    lgas: [
      "Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North",
      "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara",
      "Ohaukwu", "Onicha"
    ]
  },
  {
    state: "Edo",
    code: "ED",
    lgas: [
      "Akoko-Edo", "Egor", "Esan Central", "Esan North-East",
      "Esan South-East", "Esan West", "Etsako Central", "Etsako East",
      "Etsako West", "Igueben", "Ikpoba Okha", "Orhionmwon", "Oredo",
      "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"
    ]
  },
  {
    state: "Ekiti",
    code: "EK",
    lgas: [
      "Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West",
      "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje",
      "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"
    ]
  },
  {
    state: "Enugu",
    code: "EN",
    lgas: [
      "Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South",
      "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South",
      "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River",
      "Udenu", "Udi", "Uzo Uwani"
    ]
  },
  {
    state: "Federal Capital Territory",
    code: "FC",
    lgas: [
      "Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council (AMAC)"
    ]
  },
  {
    state: "Gombe",
    code: "GO",
    lgas: [
      "Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe",
      "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"
    ]
  },
  {
    state: "Imo",
    code: "IM",
    lgas: [
      "Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte",
      "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano",
      "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele",
      "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu",
      "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West", "Unuimo"
    ]
  },
  {
    state: "Jigawa",
    code: "JI",
    lgas: [
      "Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse",
      "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia",
      "Jahun", "Kafin Hausa", "Kazaure", "Kiri Kasama", "Kiyawa",
      "Kaugama", "Maigatari", "Malam Madori", "Miga", "Ringim",
      "Roni", "Sule Tankarkar", "Taura", "Yankwashi"
    ]
  },
  {
    state: "Kaduna",
    code: "KD",
    lgas: [
      "Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba",
      "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko",
      "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi",
      "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"
    ]
  },
  {
    state: "Kano",
    code: "KN",
    lgas: [
      "Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala",
      "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge",
      "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale",
      "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru",
      "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir",
      "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila",
      "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo",
      "Warawa", "Wudil"
    ]
  },
  {
    state: "Katsina",
    code: "KT",
    lgas: [
      "Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi",
      "Dandume", "Danja", "Dan Musa", "Daura", "Dutsi", "Dutsin Ma",
      "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara",
      "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi",
      "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana",
      "Sandamu", "Zango"
    ]
  },
  {
    state: "Kebbi",
    code: "KE",
    lgas: [
      "Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi",
      "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse",
      "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko",
      "Yauri", "Zuru"
    ]
  },
  {
    state: "Kogi",
    code: "KO",
    lgas: [
      "Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah",
      "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa Muro",
      "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"
    ]
  },
  {
    state: "Kwara",
    code: "KW",
    lgas: [
      "Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East",
      "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama",
      "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"
    ]
  },
  {
    state: "Lagos",
    code: "LA",
    lgas: [
      "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa",
      "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye",
      "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland",
      "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"
    ]
  },
  {
    state: "Nasarawa",
    code: "NA",
    lgas: [
      "Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona",
      "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"
    ]
  },
  {
    state: "Niger",
    code: "NI",
    lgas: [
      "Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati",
      "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun",
      "Magama", "Mariga", "Mashegu", "Mokwa", "Moya", "Paikoro",
      "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"
    ]
  },
  {
    state: "Ogun",
    code: "OG",
    lgas: [
      "Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ewekoro",
      "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode",
      "Ikenne", "Ilugun", "Imeko Afon", "Ipokia", "Obafemi Owode",
      "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu", "Yewa North", "Yewa South"
    ]
  },
  {
    state: "Ondo",
    code: "ON",
    lgas: [
      "Akoko North-East", "Akoko North-West", "Akoko South-East",
      "Akoko South-West", "Akure North", "Akure South", "Ese Odo",
      "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele",
      "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"
    ]
  },
  {
    state: "Osun",
    code: "OS",
    lgas: [
      "Atakunmosa East", "Atakunmosa West", "Aiyedaade", "Aiyedire",
      "Boluwaduro", "Boripe", "Ede North", "Ede South", "Ife Central",
      "Ife East", "Ife North", "Ife South", "Egbedore", "Ejigbo",
      "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West",
      "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin",
      "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"
    ]
  },
  {
    state: "Oyo",
    code: "OY",
    lgas: [
      "Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North",
      "Ibadan North-East", "Ibadan North-West", "Ibadan South-East",
      "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North",
      "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola",
      "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa",
      "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire",
      "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"
    ]
  },
  {
    state: "Plateau",
    code: "PL",
    lgas: [
      "Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North",
      "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South",
      "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"
    ]
  },
  {
    state: "Rivers",
    code: "RI",
    lgas: [
      "Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru",
      "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emuoha",
      "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor",
      "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro",
      "Oyigbo", "Port Harcourt", "Tai"
    ]
  },
  {
    state: "Sokoto",
    code: "SO",
    lgas: [
      "Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu",
      "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah",
      "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South",
      "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"
    ]
  },
  {
    state: "Taraba",
    code: "TA",
    lgas: [
      "Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi",
      "Jalingo", "Karim Lamido", "Kumi", "Lau", "Sardauna", "Takum",
      "Ussa", "Wukari", "Yorro", "Zing"
    ]
  },
  {
    state: "Yobe",
    code: "YO",
    lgas: [
      "Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam",
      "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere",
      "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"
    ]
  },
  {
    state: "Zamfara",
    code: "ZA",
    lgas: [
      "Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu",
      "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru",
      "Shinkafi", "Talata Mafara", "Tsafe", "Zurmi"
    ]
  }
];

export const NIGERIAN_BANKS = [
  "Access Bank",
  "Guaranty Trust Bank (GTCO)",
  "Zenith Bank",
  "First Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Fidelity Bank",
  "First City Monument Bank (FCMB)",
  "Stanbic IBTC Bank",
  "Union Bank of Nigeria",
  "Sterling Bank",
  "Polaris Bank",
  "Wema Bank",
  "Unity Bank",
  "Ecobank Nigeria",
  "Keystone Bank",
  "OPay Digital Services",
  "PalmPay Limited",
  "Moniepoint Microfinance Bank",
  "Kuda Bank",
  "Jaiz Bank",
  "TAJBank",
  "Lotus Bank",
  "Providus Bank",
  "Parallex Bank",
  "Signature Bank",
  "Standard Chartered Bank",
  "Other / Microfinance Bank"
];

/**
 * Standardizes Nigerian Phone Numbers to readable format
 */
export function formatNigerianPhone(input: string): string {
  const cleaned = input.replace(/\D/g, "");
  if (cleaned.startsWith("234") && cleaned.length === 13) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return input;
}

/**
 * Validates Voter's Identification Number (VIN)
 */
export function isValidVIN(vin: string): boolean {
  if (!vin) return false;
  const clean = vin.replace(/[\s-]/g, "").toUpperCase();
  return clean.length >= 8 && clean.length <= 25;
}

/**
 * Validates Nigerian 10-digit NUBAN Account Number
 */
export function isValidAccountNumber(accountNo: string): boolean {
  if (!accountNo) return false;
  const clean = accountNo.replace(/\D/g, "");
  return clean.length === 10;
}

/**
 * Generates official TMW Registration Reference ID
 */
export function generateReferenceId(stateCode: string = "NG"): string {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TMW-${stateCode.toUpperCase()}-${random}${timestamp}`;
}

export const EXCO_LEVELS = [
  { value: "Ward", label: "Ward Level (Electoral Ward EXCO)" },
  { value: "LGA", label: "LGA Level (Local Government Area EXCO)" },
  { value: "State", label: "State Level (State EXCO)" },
  { value: "National", label: "National Level (National EXCO)" },
] as const;

export const STANDARD_EXCO_ROLES_BY_LEVEL: Record<string, string[]> = {
  Ward: [
    "Ward Coordinator / Chairman (EXCO)",
    "Ward Deputy Coordinator / Vice Chairman (EXCO)",
    "Ward Secretary (EXCO)",
    "Ward Assistant Secretary (EXCO)",
    "Ward Youth Leader (EXCO)",
    "Ward Women Leader (EXCO)",
    "Ward Organizing Secretary (EXCO)",
    "Ward Publicity Secretary / PRO (EXCO)",
    "Ward Treasurer (EXCO)",
    "Ward Financial Secretary (EXCO)",
    "Ward Welfare Officer (EXCO)",
    "Ward Legal Adviser (EXCO)",
    "Polling Unit Coordinator (EXCO)",
    "Ex-Officio Member (Ward EXCO)",
    "Other Ward Executive Officer"
  ],
  LGA: [
    "LGA Coordinator / Chairman (EXCO)",
    "LGA Deputy Coordinator (EXCO)",
    "LGA Secretary (EXCO)",
    "LGA Youth Leader (EXCO)",
    "LGA Women Leader (EXCO)",
    "LGA Organizing Secretary (EXCO)",
    "LGA Publicity Secretary / PRO (EXCO)",
    "LGA Treasurer / Financial Secretary (EXCO)",
    "Other LGA Executive Officer"
  ],
  State: [
    "State Coordinator / Chairman (EXCO)",
    "State Deputy Coordinator (EXCO)",
    "State Secretary (EXCO)",
    "State Youth Leader (EXCO)",
    "State Women Leader (EXCO)",
    "State Organizing Secretary (EXCO)",
    "State Director of Mobilization (EXCO)",
    "Other State Executive Officer"
  ],
  National: [
    "Director General / National Coordinator (EXCO)",
    "Deputy Director General (EXCO)",
    "National Secretary (EXCO)",
    "National Youth Leader (EXCO)",
    "National Women Leader (EXCO)",
    "National Organizing Secretary (EXCO)",
    "National Directorate Member (EXCO)",
    "Other National Executive Officer"
  ]
};

export const STANDARD_NON_EXCO_ROLES = [
  "General Member (Non-EXCO)",
  "Polling Unit Agent / Mobilizer (Non-EXCO)",
  "Grassroots Canvasser (Non-EXCO)",
  "Volunteer / Campaign Supporter (Non-EXCO)",
  "Elder / Patron / Advisory Member (Non-EXCO)",
  "Student / Youth Wing Mobilizer (Non-EXCO)",
  "Market / Artisan Wing Member (Non-EXCO)",
  "Other Non-EXCO Member"
];

