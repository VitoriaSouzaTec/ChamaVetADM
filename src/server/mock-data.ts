export interface VerificationItem {
  id: string
  userId: string
  type: 'VET' | 'CLINIC'
  name: string
  identifier: string // CRMV-UF ou CNPJ
  crmv?: string
  crmvState?: string
  cnpj?: string
  city: string
  state: string
  status: 'PENDING' | 'NEEDS_INFO' | 'REJECTED' | 'VERIFIED'
  createdAt: string
  hoursInQueue: number
  avatarUrl?: string
  specialties?: string[]
  documents?: Array<{ name: string; url: string; type: string }>
  cnpjData?: {
    razaoSocial: string
    nomeFantasia: string
    situacaoCadastral: string
    cnae: string
    endereco: string
  }
}

export const MOCK_VERIFICATIONS: VerificationItem[] = [
  {
    id: 'ver-1',
    userId: 'u-101',
    type: 'VET',
    name: 'Dra. Camila Vasconcelos',
    identifier: '12489/CE',
    crmv: '12489',
    crmvState: 'CE',
    city: 'Fortaleza',
    state: 'CE',
    status: 'PENDING',
    createdAt: '2026-09-28T09:30:00Z',
    hoursInQueue: 55,
    specialties: ['Ultrassonografia', 'Medicina Felina'],
    documents: [
      { name: 'Carteira_CRMV_Frente_Verso.pdf', url: '#', type: 'PDF' },
      { name: 'Certificado_Pos_Ultrassom.pdf', url: '#', type: 'PDF' },
    ],
  },
  {
    id: 'ver-2',
    userId: 'u-102',
    type: 'VET',
    name: 'Dr. Lucas Silveira',
    identifier: '08742/CE',
    crmv: '08742',
    crmvState: 'CE',
    city: 'Caucaia',
    state: 'CE',
    status: 'PENDING',
    createdAt: '2026-09-29T14:15:00Z',
    hoursInQueue: 26,
    specialties: ['Cirurgia Geral', 'Ortopedia'],
    documents: [
      { name: 'CRMV_Digital.pdf', url: '#', type: 'PDF' },
    ],
  },
  {
    id: 'ver-3',
    userId: 'u-103',
    type: 'CLINIC',
    name: 'Clínica Veterinária PetCare Aldeota',
    identifier: '34.892.109/0001-44',
    cnpj: '34892109000144',
    city: 'Fortaleza',
    state: 'CE',
    status: 'PENDING',
    createdAt: '2026-09-29T10:00:00Z',
    hoursInQueue: 30,
    cnpjData: {
      razaoSocial: 'PETCARE ALDEOTA SERVICOS VETERINARIOS LTDA',
      nomeFantasia: 'PetCare Aldeota',
      situacaoCadastral: 'ATIVA',
      cnae: '75.00-1-00 - Atividades veterinárias',
      endereco: 'Av. Santos Dumont, 2800 - Aldeota, Fortaleza/CE',
    },
  },
  {
    id: 'ver-4',
    userId: 'u-104',
    type: 'CLINIC',
    name: 'Hospital Veterinário 24h Amigo Fiel',
    identifier: '19.452.883/0001-92',
    cnpj: '19452883000192',
    city: 'Maracanaú',
    state: 'CE',
    status: 'NEEDS_INFO',
    createdAt: '2026-09-27T16:00:00Z',
    hoursInQueue: 72,
    cnpjData: {
      razaoSocial: 'HOSPITAL VET AMIGO FIEL LTDA',
      nomeFantasia: 'Hospital 24h Amigo Fiel',
      situacaoCadastral: 'ATIVA',
      cnae: '75.00-1-00 - Atividades veterinárias',
      endereco: 'Rua 10, 450 - Jereissati I, Maracanaú/CE',
    },
  },
  {
    id: 'ver-5',
    userId: 'u-105',
    type: 'VET',
    name: 'Dr. Roberto Mendes',
    identifier: '11320/CE',
    crmv: '11320',
    crmvState: 'CE',
    city: 'Fortaleza',
    state: 'CE',
    status: 'VERIFIED',
    createdAt: '2026-09-25T11:00:00Z',
    hoursInQueue: 0,
    specialties: ['Anestesiologia'],
  },
]

export interface UserItem {
  id: string
  fullName: string
  email: string
  phone: string
  role: 'VET' | 'AUXILIAR' | 'CLINIC'
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED'
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO'
  identifier: string // CRMV ou CNPJ
  city: string
  state: string
  ratingAvg: number
  ratingCount: number
  createdAt: string
  lastAccess: string
  subscriptionStatus?: 'TRIAL' | 'ACTIVE' | 'OVERDUE' | 'CANCELED'
  credits?: number
  suspendedUntil?: string
  suspensionReason?: string
}

export const MOCK_USERS: UserItem[] = [
  {
    id: 'u-101',
    fullName: 'Dra. Camila Vasconcelos',
    email: 'camila.vet@gmail.com',
    phone: '85988223344',
    role: 'VET',
    status: 'ACTIVE',
    verificationStatus: 'PENDING',
    identifier: '12489/CE',
    city: 'Fortaleza',
    state: 'CE',
    ratingAvg: 4.9,
    ratingCount: 28,
    createdAt: '2026-09-10T14:00:00Z',
    lastAccess: '2026-09-30T15:20:00Z',
    subscriptionStatus: 'ACTIVE',
  },
  {
    id: 'u-102',
    fullName: 'Dr. Lucas Silveira',
    email: 'lucas.silveira@outlook.com',
    phone: '85999881122',
    role: 'VET',
    status: 'ACTIVE',
    verificationStatus: 'PENDING',
    identifier: '08742/CE',
    city: 'Caucaia',
    state: 'CE',
    ratingAvg: 4.7,
    ratingCount: 15,
    createdAt: '2026-09-12T10:00:00Z',
    lastAccess: '2026-09-30T12:40:00Z',
    subscriptionStatus: 'TRIAL',
  },
  {
    id: 'u-103',
    fullName: 'Clínica Veterinária PetCare Aldeota',
    email: 'contato@petcarealdeota.com.br',
    phone: '8532245566',
    role: 'CLINIC',
    status: 'ACTIVE',
    verificationStatus: 'PENDING',
    identifier: '34.892.109/0001-44',
    city: 'Fortaleza',
    state: 'CE',
    ratingAvg: 4.8,
    ratingCount: 42,
    createdAt: '2026-09-01T08:00:00Z',
    lastAccess: '2026-09-30T16:00:00Z',
    credits: 5,
  },
  {
    id: 'u-104',
    fullName: 'Hospital Veterinário 24h Amigo Fiel',
    email: 'diretoria@amigofiel24h.com.br',
    phone: '8533819900',
    role: 'CLINIC',
    status: 'ACTIVE',
    verificationStatus: 'NEEDS_INFO',
    identifier: '19.452.883/0001-92',
    city: 'Maracanaú',
    state: 'CE',
    ratingAvg: 4.2,
    ratingCount: 19,
    createdAt: '2026-08-20T11:30:00Z',
    lastAccess: '2026-09-29T18:10:00Z',
    credits: 2,
  },
  {
    id: 'u-105',
    fullName: 'Mariana Duarte',
    email: 'mari.duarte.aux@gmail.com',
    phone: '85987771234',
    role: 'AUXILIAR',
    status: 'SUSPENDED',
    verificationStatus: 'VERIFIED',
    identifier: 'Auxiliar Certificado',
    city: 'Fortaleza',
    state: 'CE',
    ratingAvg: 3.8,
    ratingCount: 9,
    createdAt: '2026-09-05T09:00:00Z',
    lastAccess: '2026-09-28T09:00:00Z',
    subscriptionStatus: 'OVERDUE',
    suspendedUntil: '2026-10-05T00:00:00Z',
    suspensionReason: 'Não comparecimento em plantão confirmado (No-Show).',
  },
]

export interface RequestItem {
  id: string
  clinicName: string
  clinicId: string
  specialtyName: string
  type: string // "Plantão 12h", "Ultrassom 3 pacientes", etc.
  targetProfessional: 'VET' | 'AUXILIAR'
  description: string
  workDate: string
  priceCents: number
  urgent: boolean
  status: 'DRAFT' | 'OPEN' | 'FILLED' | 'CANCELED' | 'CLOSED'
  moderationStatus: 'VISIBLE' | 'HIDDEN'
  moderationReason?: string
  interestsCount: number
  publishedAt: string
  city: string
}

export const MOCK_REQUESTS: RequestItem[] = [
  {
    id: 'req-201',
    clinicName: 'Clínica Veterinária PetCare Aldeota',
    clinicId: 'u-103',
    specialtyName: 'Ultrassonografia',
    type: 'Atendimento Pontual',
    targetProfessional: 'VET',
    description: 'Necessário ultrassonografista para 3 exames abdominais de urgência.',
    workDate: '30/09/2026 18:00',
    priceCents: 45000,
    urgent: true,
    status: 'OPEN',
    moderationStatus: 'VISIBLE',
    interestsCount: 0,
    publishedAt: '2026-09-30T13:45:00Z',
    city: 'Fortaleza',
  },
  {
    id: 'req-202',
    clinicName: 'Hospital Veterinário 24h Amigo Fiel',
    clinicId: 'u-104',
    specialtyName: 'Cirurgia Geral',
    type: 'Plantão Noturno',
    targetProfessional: 'VET',
    description: 'Plantão de retaguarda cirúrgica das 19h às 07h.',
    workDate: '01/10/2026 19:00',
    priceCents: 80000,
    urgent: false,
    status: 'FILLED',
    moderationStatus: 'VISIBLE',
    interestsCount: 4,
    publishedAt: '2026-09-29T11:00:00Z',
    city: 'Maracanaú',
  },
  {
    id: 'req-203',
    clinicName: 'PetCare Aldeota',
    clinicId: 'u-103',
    specialtyName: 'Auxiliar de Internação',
    type: 'Diária 8h',
    targetProfessional: 'AUXILIAR',
    description: 'Auxílio na medicação e monitoramento de pós-operatório.',
    workDate: '02/10/2026 08:00',
    priceCents: 18000,
    urgent: false,
    status: 'OPEN',
    moderationStatus: 'VISIBLE',
    interestsCount: 3,
    publishedAt: '2026-09-30T09:00:00Z',
    city: 'Fortaleza',
  },
  {
    id: 'req-204',
    clinicName: 'Clínica PetVip',
    clinicId: 'u-106',
    specialtyName: 'Clínica Geral',
    type: 'Atendimento',
    targetProfessional: 'VET',
    description: 'Solicitação duplicada para teste.',
    workDate: '28/09/2026 14:00',
    priceCents: 10000,
    urgent: false,
    status: 'CANCELED',
    moderationStatus: 'HIDDEN',
    moderationReason: 'Publicação duplicada pela clínica.',
    interestsCount: 0,
    publishedAt: '2026-09-28T10:00:00Z',
    city: 'Fortaleza',
  },
]

export interface ReportItem {
  id: string
  reporterName: string
  reporterId: string
  targetType: 'PROFILE' | 'REQUEST' | 'REVIEW'
  targetId: string
  targetTitle: string
  reason: 'FAKE_PROFILE' | 'INAPPROPRIATE_CONTENT' | 'NO_SHOW' | 'PAYMENT_ISSUE' | 'HARASSMENT' | 'SPAM' | 'OTHER'
  description: string
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'
  priority: 'LOW' | 'NORMAL' | 'HIGH'
  assignedTo?: string
  resolutionNote?: string
  createdAt: string
  slaHoursRemaining: number
}

export const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'rep-301',
    reporterName: 'Clínica Veterinária PetCare Aldeota',
    reporterId: 'u-103',
    targetType: 'PROFILE',
    targetId: 'u-105',
    targetTitle: 'Mariana Duarte (Auxiliar)',
    reason: 'NO_SHOW',
    description: 'A auxiliar aceitou o plantão das 19h e não apareceu nem atendeu as ligações.',
    status: 'OPEN',
    priority: 'HIGH',
    createdAt: '2026-09-30T14:30:00Z',
    slaHoursRemaining: 1.5,
  },
  {
    id: 'rep-302',
    reporterName: 'Dr. Roberto Mendes',
    reporterId: 'u-105',
    targetType: 'REVIEW',
    targetId: 'rev-401',
    targetTitle: 'Avaliação 1 estrela com ofensas',
    reason: 'INAPPROPRIATE_CONTENT',
    description: 'O cliente usou palavras de baixo calão e difamação no comentário público.',
    status: 'IN_REVIEW',
    priority: 'NORMAL',
    assignedTo: 'Mariana (Suporte)',
    createdAt: '2026-09-30T10:15:00Z',
    slaHoursRemaining: 17,
  },
  {
    id: 'rep-303',
    reporterName: 'Dra. Camila Vasconcelos',
    reporterId: 'u-101',
    targetType: 'REQUEST',
    targetId: 'req-205',
    targetTitle: 'Solicitação com valor abusivo',
    reason: 'OTHER',
    description: 'Clínica exigindo 24h ininterruptas com remuneração de R$ 50.',
    status: 'OPEN',
    priority: 'NORMAL',
    createdAt: '2026-09-30T11:00:00Z',
    slaHoursRemaining: 18,
  },
]

export interface ReviewItem {
  id: string
  reviewerName: string
  reviewedName: string
  rating: number
  comment: string
  createdAt: string
  moderationStatus: 'VISIBLE' | 'HIDDEN'
  hasOffensiveWord?: boolean
}

export const MOCK_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-401',
    reviewerName: 'Clínica Veterinária PetCare Aldeota',
    reviewedName: 'Dr. Roberto Mendes',
    rating: 5,
    comment: 'Excelente cirurgião, extremamente pontual e atencioso com a equipe.',
    createdAt: '2026-09-29T16:30:00Z',
    moderationStatus: 'VISIBLE',
  },
  {
    id: 'rev-402',
    reviewerName: 'Hospital 24h Amigo Fiel',
    reviewedName: 'Mariana Duarte',
    rating: 1,
    comment: 'Péssimo serviço, profissional irresponsável que não apareceu no plantão marcado.',
    createdAt: '2026-09-28T08:00:00Z',
    moderationStatus: 'VISIBLE',
    hasOffensiveWord: true,
  },
  {
    id: 'rev-403',
    reviewerName: 'Dra. Camila Vasconcelos',
    reviewedName: 'Clínica PetCare Aldeota',
    rating: 5,
    comment: 'Instalações cirúrgicas de primeiro mundo, equipe muito acolhedora.',
    createdAt: '2026-09-27T19:00:00Z',
    moderationStatus: 'VISIBLE',
  },
]
