import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { appLocales, type AppLocale, setActiveLocale } from "./locale";

const STORAGE_KEY = "ledger_locale";

const messages = {
	en: {
		header: {
			tagline: "betting OS",
			dashboard: "Dashboard",
			bets: "Bets",
			bankroll: "Bankroll",
			settings: "Settings",
			extension: "Extension",
			pricing: "Pricing",
			signIn: "Sign in",
			startFree: "Start free",
			activeSession: "Active session",
			signOut: "Sign out",
		},
		footer: {
			version: "Ledger v1",
			tagline: "Bet tracking and bankroll analytics",
		},
		common: {
			loading: "Loading...",
			save: "Save",
			cancel: "Cancel",
			back: "Back",
			yes: "Yes",
			no: "No",
			today: "Today",
		},
		landing: {
			heroKicker: "Bet tracking + bankroll analytics",
			heroTitle: "Track every bet. Understand your edge.",
			heroDescription:
				"Ledger gives serious sports bettors one place to log bets, manage bankroll and review ROI, yield, streaks and future CLV without the spreadsheet tax.",
			startFree: "Start free",
			openApp: "Open app",
			getExtension: "Get the Chrome extension",
			viewPricing: "View pricing",
			proofPrimary: "Built for bettors who outgrew spreadsheets.",
			proofSecondary:
				"Manual logging when you want it. One-click capture when you don't.",
			liveDesk: "Live desk",
			multiUser: "Multi-user",
			performanceTerminal: "Performance terminal",
			chromeExtension: "Chrome extension",
			captureDraft: "Capture bet draft",
			bookmaker: "Bookmaker",
			selection: "Selection",
			odds: "Odds",
			stake: "Stake",
			reviewBeforeSaving: "Review before saving. Sync instantly to Ledger.",
			whyKicker: "Why it wins",
			whyTitle: "One operating layer for every bet you place",
			whyDescription:
				"Bets are scattered, bankroll records drift and review gets skipped. Ledger brings execution and analysis into the same workflow.",
			analyticsKicker: "Analytics",
			analyticsTitle: "See where your edge actually is",
			analyticsDescription:
				"Review bankroll curve, ROI, yield, bookmaker performance, market breakdowns and disciplined bet history in one place.",
			realProductKicker: "Real product",
			realProductTitle: "Not a concept page. A working interface.",
			realProductDescription:
				"The current product already handles multi-user auth, bankroll movements, settlement states and the full bet journal workflow.",
			workflowKicker: "How it works",
			workflowTitle:
				"Three steps to turn noisy betting activity into usable intelligence",
			pricingKicker: "Pricing",
			pricingTitle: "Start free. Upgrade when speed and analysis matter.",
			pricingDescription:
				"The free plan proves the workflow. Paid plans unlock extension capture, deeper analytics and high-volume tooling.",
			faqKicker: "FAQ",
			faqTitle: "Questions a serious bettor will ask before signing up",
			finalKicker: "Ready to launch",
			finalTitle:
				"Use Ledger as the operating system for your betting workflow.",
			goToDashboard: "Go to dashboard",
			createAccount: "Create account",
			signIn: "Sign in",
			metrics: {
				roiReview: "ROI review",
				yield: "Yield",
				winRate: "Win rate",
				betsLogged: "Bets logged",
			},
			features: {
				logFasterTitle: "Log faster",
				logFasterDescription:
					"Capture bets from the bookmaker page or enter them manually when you need full control.",
				reviewDeeperTitle: "Review deeper",
				reviewDeeperDescription:
					"Understand performance by bookmaker, market, sport, stake size and time period.",
				operateClearlyTitle: "Operate clearly",
				operateClearlyDescription:
					"Track deposits, withdrawals, stake flow and bankroll movement without spreadsheet cleanup.",
			},
			workflow: {
				logBetTitle: "Log the bet",
				logBetDescription:
					"Enter bets manually or use the Chrome extension to capture the draft from the bookmaker page.",
				trackFlowTitle: "Track bankroll flow",
				trackFlowDescription:
					"Stake, deposits, withdrawals and settlements keep bankroll movement accurate without direct balance edits.",
				reviewTitle: "Review performance",
				reviewDescription:
					"Break down what works by bookmaker, market, sport and result type to tighten your process over time.",
				fromActionToRecord: "From action to record",
			},
			analyticsItems: {
				bookmakerTitle: "Bookmaker breakdowns",
				bookmakerDescription: "Know where you perform best.",
				settlementTitle: "Flexible settlement",
				settlementDescription:
					"Win, loss, void, cashout and half results.",
				timelineTitle: "Bankroll timeline",
				timelineDescription:
					"Every deposit, withdrawal and settlement accounted for.",
			},
			productBullets: {
				multiUserTitle: "Multi-user from the base layer",
				multiUserDescription:
					"Each account gets isolated sessions, bets, tags, transactions and dashboard metrics.",
				settlementTitle: "Flexible settlement model",
				settlementDescription:
					"Support for win, loss, void, half win, half loss and cashout without hacking balances.",
				extensionTitle: "Built for extension sync",
				extensionDescription:
					"The ledger model already treats each bet as an auditable flow, which is the right shape for Chrome capture.",
			},
			pricing: {
				freeName: "Free",
				freeKicker: "Build the habit",
				freeFeature1: "1 bankroll",
				freeFeature2: "Up to 50 bets per month",
				freeFeature3: "Manual bet logging",
				freeFeature4: "Basic dashboard",
				freeCta: "Start free",
				proName: "Pro",
				proKicker: "Most popular",
				proFeature1: "Unlimited bets",
				proFeature2: "Full Chrome extension capture",
				proFeature3: "Advanced analytics",
				proFeature4: "CSV export",
				proCta: "Upgrade to Pro",
				proPlusName: "Pro+",
				proPlusKicker: "High-volume users",
				proPlusFeature1: "Everything in Pro",
				proPlusFeature2: "Multiple bankrolls",
				proPlusFeature3: "Advanced reports",
				proPlusFeature4: "Automations",
				proPlusCta: "Go Pro+",
				forever: "/forever",
				month: "/month",
			},
			faqs: {
				picksQuestion: "Is Ledger a picks app?",
				picksAnswer:
					"No. Ledger is a bet tracking and bankroll analytics product. It helps you review performance, not generate predictions.",
				extensionQuestion: "Do I need the Chrome extension?",
				extensionAnswer:
					"No. The app works with manual bet entry. The extension is the speed layer for users who want to remove typing and reduce mistakes.",
				audienceQuestion: "Who is this for?",
				audienceAnswer:
					"Serious sports bettors, traders and small betting operators who already care about record quality, bankroll discipline and review.",
				bookmakersQuestion: "Will more bookmakers be supported?",
				bookmakersAnswer:
					"Yes. The rollout should start narrow with a few strong integrations, then expand sportsbook coverage without sacrificing reliability.",
			},
		},
		login: {
			kicker: "bankroll control",
			title: "The desk that treats stake, return and cash flow like a proper ledger.",
			description:
				"Sign in or create your account to track bets with isolated bankroll, ROI and curve per user.",
			access: "Access",
			loginTitle: "Enter the desk",
			signupTitle: "Open new account",
			login: "Login",
			signup: "Signup",
			email: "Email",
			password: "Password",
			confirmPassword: "Confirm password",
			loginLoading: "Signing in...",
			loginAction: "Sign in",
			signupLoading: "Creating account...",
			signupAction: "Create account",
			loginHelp:
				"Login is for existing accounts. Each account sees only its own bankroll.",
			signupHelp:
				"Signup automatically creates a new user with its own main bankroll and zero starting balance.",
			emailPlaceholder: "you@domain.com",
			cards: {
				isolated: ["Isolated bankroll", "Each account starts with its own bankroll."],
				settlement: ["Fast settlement", "Win, loss, void and half outcomes without manual recalculation."],
				private: ["Private session", "Each user sees only their own bets and metrics."],
			},
		},
		app: {
			activeAccount: "Active account",
			title: "Run your bankroll like an operating desk.",
			description:
				"Each user runs an isolated bankroll with separate balance, protected session and independent metrics in real time.",
			session: "Session",
			newBet: "New bet",
			moveBankroll: "Move bankroll",
			currentBalance: "Current balance",
			netProfit: "Net profit",
			settledBets: "{{count}} settled bets",
			currentStreak: "Current streak: {{count}} {{tone}}",
			noActiveStreak: "No active streak",
			freeUsage: "Free usage",
			betsUsedThisMonth: "{{used}}/{{limit}} bets used this month",
			upgradeMessage:
				"Upgrade to Pro to remove the monthly logging cap and unlock the full analytics layer.",
			upgradePlan: "Upgrade plan",
			premiumAnalytics: "Premium analytics",
			unlockCurve: "Unlock the bankroll curve",
			premiumMessage:
				"Free users keep the core scoreboard. Pro unlocks the full curve, deeper breakdowns and the extension workflow.",
			seePlans: "See plans",
			efficiency: "Efficiency",
			operationalRead: "Operational read",
			yield: "Yield",
			bestGreen: "Best green streak",
			bestRed: "Best red streak",
			lastUpdate: "Last update",
			recentActivity: "Recent activity",
			recentBets: "Recent bets",
			viewAll: "View all",
			noBetsTitle: "No bets logged yet",
			noBetsDescription:
				"Start by logging the first bet to unlock balance tracking, bankroll curve and analytics.",
			createFirstBet: "Create first bet",
			stake: "Stake",
			open: "Open",
			advancedAnalyticsLocked:
				"Advanced analytics is part of Pro. Upgrade to unlock yield breakdowns, bankroll curve and deeper performance review.",
		},
		bankroll: {
			kicker: "Cash desk",
			title: "Move bankroll",
			importCsv: "Import CSV",
			importing: "Importing...",
			importHint:
				"Import movements with columns type, amount_brl, occurred_at and optional note. Accepts deposit, withdraw and adjustment.",
			importSuccess: "{{count}} movements imported.",
			importError: "Could not import the CSV movements.",
			currentBalance: "Current balance",
			occurredAt: "Date and time",
			deposit: "Deposit",
			withdraw: "Withdraw",
			adjustment: "Manual adjustment",
			typeLabels: {
				deposit: "Deposit",
				withdraw: "Withdraw",
				adjustment: "Adjustment",
				bet_open: "Bet entry",
				bet_settlement: "Bet settlement",
			},
			amountPlaceholder: "Amount in BRL",
			notePlaceholder: "Reason or note",
			submitting: "Posting...",
			submit: "Record transaction",
			editSubmit: "Save changes",
			editTransaction: "Edit transaction",
			deleteTransaction: "Delete transaction",
			deleting: "Deleting...",
			cancelEdit: "Cancel editing",
			movementFallback: "Movement",
		},
		bets: {
			book: "Book",
			title: "All bets",
			importCsv: "Import CSV",
			importing: "Importing...",
			importHint:
				"Import bets from a CSV using the exported headers: event_name, status, sport, market, selection, bookmaker, odds_decimal, stake_brl, placed_at and optional settled_at, gross_return_brl, tags, note.",
			importSuccess: "{{count}} bets imported.",
			importError: "Could not import the CSV bets.",
			newBet: "New bet",
			exportCsv: "Export CSV",
			exporting: "Exporting...",
			csvUpgrade:
				"CSV export is a Pro feature. Upgrade to export filtered bet history and bookmaker performance outside Ledger.",
			seePlans: "See plans",
			allStatuses: "All statuses",
			filterSport: "Filter by sport",
			filterBookmaker: "Filter by bookmaker",
			filterTag: "Filter by tag",
			applyFilters: "Apply filters",
			event: "Event",
			status: "Status",
			bookmaker: "Book",
			stake: "Stake",
			odds: "Odds",
			profitLoss: "P/L",
			date: "Date",
			actions: "Actions",
			detail: "Detail",
			open: "Open",
			emptyTitle: "Nothing here yet",
			emptyDescription:
				"Once you log bets, they appear in this desk with filters persisted in the URL.",
			createFirstBet: "Create first bet",
			createKicker: "New entry",
			createTitle: "Register bet",
			editKicker: "Edit entry",
			editTitle: "Update bet",
			backToBook: "Back to the book",
			sport: "Sport",
			market: "Market",
			selection: "Selection",
			tags: "Tags",
			tagsHint: "Comma separated",
			placedAt: "Entry date",
			note: "Entry read",
			notePlaceholder: "Context, line, value read and bankroll management.",
			previewTitle: "Settlement preview",
			returnAmount: "Return",
			profit: "Profit",
			createError: "Could not create the bet.",
			updateError: "Could not update the bet.",
			settleError: "Could not settle the bet.",
			deleteError: "Could not delete the bet.",
			reopenError: "Could not reopen the bet.",
			betLabel: "Bet",
			quickSettlement: "Settlement",
			quickAdjustment: "Quick adjustment",
			settleNow: "Settle now",
			recalculateSettlement: "Recalculate settlement",
			reopening: "Reopening...",
			reopenBet: "Reopen bet",
			deleteBetAndTransactions: "Delete bet and linked transactions",
			returnCashoutPlaceholder: "Cashout return in BRL",
			stakeLabel: "Stake",
			returnLabel: "Return",
			profitLabel: "Profit",
			cashout: "Cashout",
		},
		settings: {
			user: "User",
			subscription: "Subscription",
			billing: "Billing",
			extension: "Extension",
			security: "Security",
			changePassword: "Change password",
			currentPassword: "Current password",
			newPassword: "New password",
			updatePassword: "Update password",
			updating: "Updating...",
			title: "Settings",
			email: "Email",
			currentBankroll: "Current bankroll",
			active: "Active",
			paidAccessEnded:
				"Paid access ended. The account is back on Free entitlements.",
			betsUsedThisMonth: "{{used}}/{{limit}} bets used this month",
			billingTitle: "Plan, upgrades and cancellation",
			stripeMissing:
				"Stripe is not configured in this environment yet. Add keys and price IDs to enable Checkout and Customer Portal.",
			accessNow: "Access now",
			billingStatus: "Billing status",
			renewal: "Renewal",
			notScheduled: "Not scheduled",
			openingPortal: "Opening portal...",
			lifetimePlan: "Lifetime plan",
			lifetimePrice: "No renewal",
			lifetimeDescription:
				"All premium features are unlocked on this account with no recurring renewal.",
			lifetimeStatus: "Status: active. Lifetime access is active on this account.",
			reviewBillingHistory: "Review billing history",
			manageSubscription: "Manage subscription",
			openCustomerPortal: "Open customer portal",
			accessEndsAt: "Access ends at ",
			currentPeriodEndsAt: "Current period ends at ",
			extensionTitle: "Capture and export access",
			extensionDescription:
				"Your plan includes extension capture. Open the Chrome extension, sign in with your Ledger email and password, then start capturing drafts from bookmaker pages.",
			extensionLocked:
				"Free accounts can log bets manually. Upgrade to Pro when you want CSV export and the Chrome extension capture workflow.",
			featureIncluded: "Included in your current access",
			proRequired: "Pro required",
			extensionCaptureTitle: "Chrome extension capture",
			extensionCaptureDescription:
				"Connect the extension, capture bets from bookmaker pages and push drafts into Ledger with less typing.",
			csvTitle: "CSV export",
			csvDescription:
				"Download filtered bet history for external reporting, tax workflows or deeper analysis outside the app.",
			csvReady: "Ready to use in Bets",
			stepsOpenExtension: "1. Open the Chrome extension popup.",
			stepsSignInExtension:
				"2. Enter your Ledger app URL, email and password.",
			stepsExchangeToken:
				"3. The extension keeps a persistent device session after login.",
			securityTitle: "Change password",
			passwordUpdated: "Password updated.",
			planLifetime: "Lifetime",
			planProPlus: "Pro+",
			planPro: "Pro",
			planFree: "Free",
			statusInactive: "inactive",
			checkoutSuccess:
				"Checkout completed. Access should refresh as soon as Stripe confirms the subscription.",
			checkoutCanceled:
				"Checkout canceled. No billing changes were applied.",
			cancelScheduled:
				"Cancellation scheduled. Premium access stays active until the current period ends.",
			activeSubscription:
				"Subscription active. Manage upgrades, downgrades or billing details below.",
			expiredSubscription:
				"Subscription inactive. You can reactivate a paid plan at any time.",
		},
		locale: {
			label: "Language",
			en: "EN",
			ptBR: "PT-BR",
			status: {
				open: "Open",
				win: "Win",
				loss: "Loss",
				void: "Void",
				cashout: "Cashout",
				halfWin: "Half win",
				halfLoss: "Half loss",
			},
		},
	},
	"pt-BR": {
		header: {
			tagline: "operating desk",
			dashboard: "Dashboard",
			bets: "Apostas",
			bankroll: "Banca",
			settings: "Ajustes",
			extension: "Extensão",
			pricing: "Preços",
			signIn: "Entrar",
			startFree: "Começar grátis",
			activeSession: "Sessão ativa",
			signOut: "Sair",
		},
		footer: {
			version: "Ledger v1",
			tagline: "Registro de apostas e analytics de banca",
		},
		common: {
			loading: "Carregando...",
			save: "Salvar",
			cancel: "Cancelar",
			back: "Voltar",
			yes: "Sim",
			no: "Não",
			today: "Hoje",
		},
		landing: {
			heroKicker: "Bet tracking + analytics de banca",
			heroTitle: "Registre cada aposta. Entenda sua vantagem.",
			heroDescription:
				"O Ledger dá ao apostador sério um lugar para registrar bets, controlar a banca e revisar ROI, yield, streaks e futuro CLV sem imposto de planilha.",
			startFree: "Começar grátis",
			openApp: "Abrir app",
			getExtension: "Pegar extensão Chrome",
			viewPricing: "Ver preços",
			proofPrimary: "Feito para apostadores que superaram a planilha.",
			proofSecondary:
				"Registro manual quando você quiser. Captura em um clique quando não quiser.",
			liveDesk: "Mesa ativa",
			multiUser: "Multi-user",
			performanceTerminal: "Terminal de performance",
			chromeExtension: "Extensão Chrome",
			captureDraft: "Capturar rascunho da bet",
			bookmaker: "Casa",
			selection: "Seleção",
			odds: "Odd",
			stake: "Stake",
			reviewBeforeSaving: "Revise antes de salvar. Sincronize na hora com o Ledger.",
			whyKicker: "Por que funciona",
			whyTitle: "Uma camada operacional para cada aposta que você faz",
			whyDescription:
				"As bets ficam espalhadas, o histórico da banca deriva e a revisão some. O Ledger junta execução e análise no mesmo fluxo.",
			analyticsKicker: "Analytics",
			analyticsTitle: "Veja onde sua vantagem realmente está",
			analyticsDescription:
				"Revise curva da banca, ROI, yield, performance por casa, breakdowns por mercado e histórico disciplinado em um lugar só.",
			realProductKicker: "Produto real",
			realProductTitle: "Não é concept page. É interface funcionando.",
			realProductDescription:
				"O produto atual já cobre autenticação multi-user, movimentação de banca, estados de liquidação e o fluxo completo de diário de bets.",
			workflowKicker: "Como funciona",
			workflowTitle:
				"Três passos para transformar ruído operacional em inteligência útil",
			pricingKicker: "Preços",
			pricingTitle: "Comece grátis. Faça upgrade quando velocidade e análise importarem.",
			pricingDescription:
				"O plano free prova o fluxo. Os pagos liberam captura pela extensão, analytics mais profundo e ferramentas para volume alto.",
			faqKicker: "FAQ",
			faqTitle: "Perguntas que um apostador sério faz antes de criar conta",
			finalKicker: "Pronto para usar",
			finalTitle:
				"Use o Ledger como sistema operacional do seu fluxo de apostas.",
			goToDashboard: "Ir para dashboard",
			createAccount: "Criar conta",
			signIn: "Entrar",
			metrics: {
				roiReview: "Leitura de ROI",
				yield: "Yield",
				winRate: "Taxa de acerto",
				betsLogged: "Bets registradas",
			},
			features: {
				logFasterTitle: "Registre mais rápido",
				logFasterDescription:
					"Capture bets da página da casa ou lance manualmente quando quiser controle total.",
				reviewDeeperTitle: "Revise mais fundo",
				reviewDeeperDescription:
					"Entenda performance por casa, mercado, esporte, tamanho de stake e período.",
				operateClearlyTitle: "Opere com clareza",
				operateClearlyDescription:
					"Acompanhe depósitos, saques, fluxo de stake e movimento de banca sem limpar planilha.",
			},
			workflow: {
				logBetTitle: "Registre a bet",
				logBetDescription:
					"Lance manualmente ou use a extensão Chrome para capturar o rascunho da página da casa.",
				trackFlowTitle: "Acompanhe o fluxo da banca",
				trackFlowDescription:
					"Stake, depósitos, saques e liquidações mantêm a movimentação correta sem editar saldo direto.",
				reviewTitle: "Revise performance",
				reviewDescription:
					"Quebre o que funciona por casa, mercado, esporte e tipo de resultado para apertar seu processo.",
				fromActionToRecord: "Da ação ao registro",
			},
			analyticsItems: {
				bookmakerTitle: "Breakdown por casa",
				bookmakerDescription: "Saiba onde você performa melhor.",
				settlementTitle: "Liquidação flexível",
				settlementDescription:
					"Win, loss, void, cashout e resultados parciais.",
				timelineTitle: "Linha do tempo da banca",
				timelineDescription:
					"Cada depósito, saque e liquidação contabilizado.",
			},
			productBullets: {
				multiUserTitle: "Multi-user desde a base",
				multiUserDescription:
					"Cada conta ganha sessões, bets, tags, transações e métricas de dashboard isoladas.",
				settlementTitle: "Modelo flexível de liquidação",
				settlementDescription:
					"Suporte a win, loss, void, half win, half loss e cashout sem gambiarra no saldo.",
				extensionTitle: "Feito para sincronizar com extensão",
				extensionDescription:
					"O modelo de ledger já trata cada bet como fluxo auditável, que é o formato certo para captura via Chrome.",
			},
			pricing: {
				freeName: "Free",
				freeKicker: "Crie o hábito",
				freeFeature1: "1 banca",
				freeFeature2: "Até 50 bets por mês",
				freeFeature3: "Registro manual",
				freeFeature4: "Dashboard básico",
				freeCta: "Começar grátis",
				proName: "Pro",
				proKicker: "Mais popular",
				proFeature1: "Bets ilimitadas",
				proFeature2: "Captura completa pela extensão Chrome",
				proFeature3: "Analytics avançado",
				proFeature4: "Exportação CSV",
				proCta: "Fazer upgrade para Pro",
				proPlusName: "Pro+",
				proPlusKicker: "Usuários de alto volume",
				proPlusFeature1: "Tudo do Pro",
				proPlusFeature2: "Múltiplas bancas",
				proPlusFeature3: "Relatórios avançados",
				proPlusFeature4: "Automações",
				proPlusCta: "Ir para Pro+",
				forever: "/para sempre",
				month: "/mês",
			},
			faqs: {
				picksQuestion: "O Ledger é um app de picks?",
				picksAnswer:
					"Não. O Ledger é um produto de registro de bets e analytics de banca. Ele ajuda a revisar performance, não a gerar previsões.",
				extensionQuestion: "Preciso da extensão Chrome?",
				extensionAnswer:
					"Não. O app funciona com registro manual. A extensão é a camada de velocidade para quem quer remover digitação e reduzir erro.",
				audienceQuestion: "Para quem é isso?",
				audienceAnswer:
					"Apostadores esportivos sérios, traders e pequenas operações de betting que já se importam com qualidade de registro, disciplina de banca e revisão.",
				bookmakersQuestion: "Mais casas serão suportadas?",
				bookmakersAnswer:
					"Sim. O rollout deve começar estreito, com algumas integrações fortes, e depois expandir a cobertura sem sacrificar confiabilidade.",
			},
		},
		login: {
			kicker: "controle de banca",
			title: "O painel que trata stake, retorno e caixa como um livro-razão.",
			description:
				"Entre ou crie sua conta para acompanhar suas apostas com banca, ROI e curva totalmente isolados por usuário.",
			access: "Acesso",
			loginTitle: "Entrar na mesa",
			signupTitle: "Abrir nova conta",
			login: "Login",
			signup: "Cadastro",
			email: "Email",
			password: "Senha",
			confirmPassword: "Confirmar senha",
			loginLoading: "Entrando...",
			loginAction: "Entrar",
			signupLoading: "Criando conta...",
			signupAction: "Criar conta",
			loginHelp:
				"Login é para contas existentes. Cada conta acessa apenas a própria banca.",
			signupHelp:
				"O cadastro cria automaticamente um novo usuário com banca principal própria e saldo inicial zero.",
			emailPlaceholder: "voce@dominio.com",
			cards: {
				isolated: ["Banca isolada", "Cada conta nasce com uma banca própria."],
				settlement: ["Liquidação rápida", "Win, loss, void e halfs sem recálculo manual."],
				private: ["Sessão privada", "Cada usuário enxerga apenas as próprias bets e métricas."],
			},
		},
		app: {
			activeAccount: "Conta ativa",
			title: "Controle a banca como uma mesa de operação.",
			description:
				"Cada usuário opera a própria banca, com sessão isolada, saldo separado e métricas independentes em tempo real.",
			session: "Sessão",
			newBet: "Nova bet",
			moveBankroll: "Movimentar banca",
			currentBalance: "Saldo atual",
			netProfit: "Lucro líquido",
			settledBets: "{{count}} bets liquidadas",
			currentStreak: "Streak atual: {{count}} {{tone}}",
			noActiveStreak: "Sem streak ativa",
			freeUsage: "Uso do plano free",
			betsUsedThisMonth: "{{used}}/{{limit}} bets usadas neste mês",
			upgradeMessage:
				"Faça upgrade para Pro para remover o limite mensal de registro e liberar a camada completa de analytics.",
			upgradePlan: "Fazer upgrade",
			premiumAnalytics: "Analytics premium",
			unlockCurve: "Desbloqueie a curva da banca",
			premiumMessage:
				"Usuários free ficam com o placar principal. O Pro libera a curva completa, breakdowns mais profundos e o fluxo com extensão.",
			seePlans: "Ver planos",
			efficiency: "Efetividade",
			operationalRead: "Leitura operacional",
			yield: "Yield",
			bestGreen: "Melhor green",
			bestRed: "Melhor red",
			lastUpdate: "Última atualização",
			recentActivity: "Últimas movimentações",
			recentBets: "Bets recentes",
			viewAll: "Ver todas",
			noBetsTitle: "Nenhuma bet registrada",
			noBetsDescription:
				"Comece registrando a primeira entrada para liberar saldo, curva e analytics.",
			createFirstBet: "Criar primeira bet",
			stake: "Stake",
			open: "Em aberto",
			advancedAnalyticsLocked:
				"Analytics avançado faz parte do Pro. Faça upgrade para liberar yield, curva da banca e revisão de performance mais profunda.",
		},
		bankroll: {
			kicker: "Caixa",
			title: "Movimentar banca",
			importCsv: "Importar CSV",
			importing: "Importando...",
			importHint:
				"Importe movimentações com as colunas type, amount_brl, occurred_at e note opcional. Aceita deposit, withdraw e adjustment.",
			importSuccess: "{{count}} movimentações importadas.",
			importError: "Nao foi possivel importar as movimentacoes do CSV.",
			currentBalance: "Saldo atual",
			occurredAt: "Data e hora",
			deposit: "Depósito",
			withdraw: "Saque",
			adjustment: "Ajuste manual",
			typeLabels: {
				deposit: "Depósito",
				withdraw: "Saque",
				adjustment: "Ajuste",
				bet_open: "Entrada da bet",
				bet_settlement: "Liquidação da bet",
			},
			amountPlaceholder: "Valor em BRL",
			notePlaceholder: "Motivo ou observação",
			submitting: "Lançando...",
			submit: "Registrar transação",
			editSubmit: "Salvar alterações",
			editTransaction: "Editar transação",
			deleteTransaction: "Excluir transação",
			deleting: "Excluindo...",
			cancelEdit: "Cancelar edição",
			movementFallback: "Movimentação",
		},
		bets: {
			book: "Book",
			title: "Todas as bets",
			importCsv: "Importar CSV",
			importing: "Importando...",
			importHint:
				"Importe bets de um CSV usando os headers exportados: event_name, status, sport, market, selection, bookmaker, odds_decimal, stake_brl, placed_at e opcionais settled_at, gross_return_brl, tags, note.",
			importSuccess: "{{count}} bets importadas.",
			importError: "Nao foi possivel importar as bets do CSV.",
			newBet: "Nova bet",
			exportCsv: "Exportar CSV",
			exporting: "Exportando...",
			csvUpgrade:
				"Exportação CSV é recurso Pro. Faça upgrade para exportar histórico filtrado e performance por casa fora do Ledger.",
			seePlans: "Ver planos",
			allStatuses: "Todos os status",
			filterSport: "Filtrar por esporte",
			filterBookmaker: "Filtrar por casa",
			filterTag: "Filtrar por tag",
			applyFilters: "Aplicar filtro",
			event: "Evento",
			status: "Status",
			bookmaker: "Casa",
			stake: "Stake",
			odds: "Odd",
			profitLoss: "P/L",
			date: "Data",
			actions: "Ações",
			detail: "Detalhe",
			open: "Em aberto",
			emptyTitle: "Nada por aqui ainda",
			emptyDescription:
				"Quando você registrar as entradas, elas aparecem nesta mesa com filtros persistidos na URL.",
			createFirstBet: "Criar primeira bet",
			createKicker: "Nova entrada",
			createTitle: "Registrar bet",
			editKicker: "Editar entrada",
			editTitle: "Atualizar bet",
			backToBook: "Voltar para o book",
			sport: "Esporte",
			market: "Mercado",
			selection: "Seleção",
			tags: "Tags",
			tagsHint: "Separadas por vírgula",
			placedAt: "Data da entrada",
			note: "Leitura da entrada",
			notePlaceholder: "Contexto, linha, leitura de valor e gestão.",
			previewTitle: "Prévia de liquidação",
			returnAmount: "Retorno",
			profit: "Lucro",
			createError: "Não foi possível criar a bet.",
			updateError: "Não foi possível atualizar a bet.",
			settleError: "Não foi possível liquidar a bet.",
			deleteError: "Não foi possível apagar a bet.",
			reopenError: "Não foi possível reabrir a bet.",
			betLabel: "Bet",
			quickSettlement: "Liquidação",
			quickAdjustment: "Ajuste rápido",
			settleNow: "Liquidar agora",
			recalculateSettlement: "Recalcular liquidação",
			reopening: "Reabrindo...",
			reopenBet: "Reabrir bet",
			deleteBetAndTransactions: "Apagar bet e transações vinculadas",
			returnCashoutPlaceholder: "Retorno do cashout em BRL",
			stakeLabel: "Stake",
			returnLabel: "Retorno",
			profitLabel: "Lucro",
			cashout: "Cashout",
		},
		settings: {
			user: "Usuário",
			subscription: "Assinatura",
			billing: "Billing",
			extension: "Extensão",
			security: "Segurança",
			changePassword: "Trocar senha",
			currentPassword: "Senha atual",
			newPassword: "Nova senha",
			updatePassword: "Atualizar senha",
			updating: "Atualizando...",
			title: "Ajustes",
			email: "Email",
			currentBankroll: "Banca atual",
			active: "Ativa",
			paidAccessEnded:
				"O acesso pago terminou. A conta voltou para os entitlements do plano Free.",
			betsUsedThisMonth: "{{used}}/{{limit}} bets usadas neste mês",
			billingTitle: "Plano, upgrades e cancelamento",
			stripeMissing:
				"O Stripe ainda não está configurado neste ambiente. Adicione as chaves e os price IDs para liberar Checkout e Customer Portal.",
			accessNow: "Acesso agora",
			billingStatus: "Status da cobrança",
			renewal: "Renovação",
			notScheduled: "Não agendado",
			openingPortal: "Abrindo portal...",
			lifetimePlan: "Plano vitalício",
			lifetimePrice: "Sem renovação",
			lifetimeDescription:
				"Todos os recursos premium estão liberados nesta conta sem renovação recorrente.",
			lifetimeStatus:
				"Status: ativo. O acesso vitalício está liberado nesta conta.",
			reviewBillingHistory: "Revisar histórico de cobrança",
			manageSubscription: "Gerenciar assinatura",
			openCustomerPortal: "Abrir customer portal",
			accessEndsAt: "O acesso termina em ",
			currentPeriodEndsAt: "O período atual termina em ",
			extensionTitle: "Acesso a captura e exportação",
			extensionDescription:
				"Seu plano inclui captura por extensão. Abra a extensão Chrome, entre com seu email e senha do Ledger e comece a capturar rascunhos das páginas das casas.",
			extensionLocked:
				"Contas free podem registrar bets manualmente. Faça upgrade para Pro quando quiser exportação CSV e o fluxo de captura pela extensão Chrome.",
			featureIncluded: "Incluído no seu acesso atual",
			proRequired: "Pro necessário",
			extensionCaptureTitle: "Captura pela extensão Chrome",
			extensionCaptureDescription:
				"Conecte a extensão, capture bets das páginas das casas e envie rascunhos para o Ledger com menos digitação.",
			csvTitle: "Exportação CSV",
			csvDescription:
				"Baixe histórico filtrado de bets para relatórios externos, rotinas fiscais ou análise mais profunda fora do app.",
			csvReady: "Pronto para usar em Bets",
			stepsOpenExtension: "1. Abra o popup da extensão Chrome.",
			stepsSignInExtension:
				"2. Informe a URL do app, seu email e sua senha do Ledger.",
			stepsExchangeToken:
				"3. A extensão mantém uma sessão persistente do dispositivo após o login.",
			securityTitle: "Trocar senha",
			passwordUpdated: "Senha atualizada.",
			planLifetime: "Lifetime",
			planProPlus: "Pro+",
			planPro: "Pro",
			planFree: "Free",
			statusInactive: "inativa",
			checkoutSuccess:
				"Checkout concluído. O acesso deve atualizar assim que o Stripe confirmar a assinatura.",
			checkoutCanceled:
				"Checkout cancelado. Nenhuma alteração de cobrança foi aplicada.",
			cancelScheduled:
				"Cancelamento agendado. O acesso premium continua ativo até o fim do período atual.",
			activeSubscription:
				"Assinatura ativa. Gerencie upgrade, downgrade ou dados de cobrança abaixo.",
			expiredSubscription:
				"Assinatura inativa. Você pode reativar um plano pago a qualquer momento.",
		},
		locale: {
			label: "Idioma",
			en: "EN",
			ptBR: "PT-BR",
			status: {
				open: "Em aberto",
				win: "Win",
				loss: "Loss",
				void: "Void",
				cashout: "Cashout",
				halfWin: "Half win",
				halfLoss: "Half loss",
			},
		},
	},
} as const;

type Messages = (typeof messages)["en"];

type I18nContextValue = {
	locale: AppLocale;
	setLocale: (locale: AppLocale) => void;
	t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getMessage(locale: AppLocale, key: string) {
	const parts = key.split(".");
	let current: unknown = messages[locale];
	for (const part of parts) {
		if (typeof current !== "object" || current == null || !(part in current)) {
			current = messages.en;
			for (const fallbackPart of parts) {
				if (
					typeof current !== "object" ||
					current == null ||
					!(fallbackPart in current)
				) {
					return key;
				}
				current = (current as Record<string, unknown>)[fallbackPart];
			}
			break;
		}
		current = (current as Record<string, unknown>)[part];
	}
	return typeof current === "string" ? current : key;
}

function interpolate(
	value: string,
	vars?: Record<string, string | number>,
) {
	if (!vars) {
		return value;
	}

	return Object.entries(vars).reduce(
		(result, [name, replacement]) =>
			result.replaceAll(`{{${name}}}`, String(replacement)),
		value,
	);
}

function resolveInitialLocale(): AppLocale {
	if (typeof window === "undefined") {
		return "en";
	}

	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored && appLocales.includes(stored as AppLocale)) {
		return stored as AppLocale;
	}

	const browserLocale = window.navigator.language;
	return browserLocale.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<AppLocale>("en");

	useEffect(() => {
		const initialLocale = resolveInitialLocale();
		setLocaleState(initialLocale);
		setActiveLocale(initialLocale);
		document.documentElement.lang = initialLocale;
	}, []);

	const setLocale = (nextLocale: AppLocale) => {
		setLocaleState(nextLocale);
		setActiveLocale(nextLocale);
		if (typeof window !== "undefined") {
			window.localStorage.setItem(STORAGE_KEY, nextLocale);
			document.documentElement.lang = nextLocale;
		}
	};

	const value = useMemo<I18nContextValue>(
		() => ({
			locale,
			setLocale,
			t: (key, vars) => interpolate(getMessage(locale, key), vars),
		}),
		[locale],
	);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("useI18n must be used within I18nProvider.");
	}
	return context;
}

export function useLocaleLabel(locale: AppLocale) {
	const { t } = useI18n();
	return locale === "pt-BR" ? t("locale.ptBR") : t("locale.en");
}

export function getLocaleMessages(locale: AppLocale): Messages {
	return messages[locale] as Messages;
}
