import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../services/dashboard.service';
import { demandeAideService } from '../../../services/demande-aide';
import { OrganisationService } from '../../../services/organisation';
import { BeneficiaireService } from '../../../services/beneficiaire';
import { DonService } from '../../../services/don.service.ts';
import { CategorieDemandeService } from '../../../services/categorie-demande';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface DashboardProjetItem {
  id: number;
  nom: string;
  localisation: string;
  type: string;
  typeAide: string;
  statut: string;
  statutClass: string;
  date: string;
  rawDate?: Date;
  montantNecessaire?: number;
  montantCollecte?: number;
  priorite: string;
  prioriteClass: string;
  beneficiaireNom: string;
  beneficiairePhone: string;
}

export interface ChartPoint {
  x: number;
  y: number;
  label: string;
  value: number;
  formattedValue: string;
}

export interface AidDistributionItem {
  label: string;
  count: number;
  percent: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdmin implements OnInit {
  stats: any = {
    totalOrganisations: 0,
    totalBeneficiaires: 0,
    totalDemandesAide: 0,
    totalDons: 0,
    montantTotalCollecte: 0,
    demandesEnAttente: 0,
    demandesValidees: 0,
    demandesRefusees: 0
  };

  // Filtres
  recherche: string = '';
  typeAideSelectionne: string = '';
  categorieSelectionnee: string = '';
  urgenceSelectionnee: string = '';
  statutSelectionne: string = '';
  sortOrder: 'asc' | 'desc' = 'desc';

  listeCategories: string[] = ['Santé', 'Alimentation', 'Logement', 'Éducation'];  // Graphique Aperçu des Dons & Aides
  chartMetric: 'dons' | 'demandes' = 'dons';
  selectedPeriod: string = 'ce mois';
  currentPeriodTotal: number = 0;
  chartPoints: ChartPoint[] = [];
  chartCurvePath: string = '';
  chartAreaPath: string = '';
  hoveredDonPoint: ChartPoint | null = null;
  listeDonsFinanciers: any[] = [];

  // Graphique Répartition de l'Aide
  repartitionAide: AidDistributionItem[] = [];
  hoveredCategory: AidDistributionItem | null = null;

  projetsDons: DashboardProjetItem[] = [];

  constructor(
    private dashboardService: DashboardService,
    private demandeService: demandeAideService,
    private organisationService: OrganisationService,
    private beneficiaireService: BeneficiaireService,
    private donService: DonService,
    private categorieDemandeService: CategorieDemandeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.chargerCategories();
    this.chargerDons();
    this.chargerStats();
    this.chargerDemandes();
  }

  chargerDons() {
    forkJoin({
      financiers: this.donService.getAllDonsFinanciers().pipe(catchError(() => of([]))),
      globaux: this.donService.getAllDons().pipe(catchError(() => of([])))
    }).subscribe(({ financiers, globaux }) => {
      const map = new Map<number, any>();
      (financiers || []).forEach((f: any) => {
        if (f && f.id) map.set(f.id, f);
      });
      (globaux || []).forEach((g: any) => {
        if (g && g.id && !map.has(g.id)) {
          map.set(g.id, g);
        }
      });
      this.listeDonsFinanciers = Array.from(map.values());
      this.actualiserGraphiqueDons();
      this.cdr.detectChanges();
    });
  }

  chargerCategories() {
    this.categorieDemandeService.getCategories().pipe(
      catchError(() => of([]))
    ).subscribe((cats) => {
      if (cats && cats.length > 0) {
        this.listeCategories = cats.map(c => c.nom);
      }
    });
  }

  chargerStats(tentative = 1) {
    this.dashboardService.getAdminDashboardStats().subscribe({
      next: (data: any) => {
        this.stats = {
          totalOrganisations: data.totalOrganisations || 0,
          totalBeneficiaires: data.totalBeneficiaires || 0,
          totalDemandesAide: data.totalDemandesAide || 0,
          totalDons: data.totalDons || 0,
          montantTotalCollecte: data.montantTotalCollecte || 0,
          demandesEnAttente: data.demandesEnAttente || 0,
          demandesValidees: data.demandesValidees || 0,
          demandesRefusees: data.demandesRefusees || 0
        };
        this.actualiserGraphiqueDons();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.warn('Erreur chargement des stats dashboard via API backend, bascule sur calcul fallback', err);
        this.chargerStatsFallback(tentative);
      }
    });
  }

  chargerStatsFallback(tentative = 1) {
    forkJoin({
      demandes: this.demandeService.getDemandes().pipe(catchError(() => of([]))),
      organisations: this.organisationService.getAllOrganisations().pipe(catchError(() => of([]))),
      beneficiaires: this.beneficiaireService.trouverTous().pipe(catchError(() => of([]))),
      donsFinanciers: this.donService.getAllDonsFinanciers().pipe(catchError(() => of([]))),
      donsGlobaux: this.donService.getAllDons().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ demandes, organisations, beneficiaires, donsFinanciers, donsGlobaux }) => {
        const montantFinancierTotal = (donsFinanciers || []).reduce((sum: number, d: any) => sum + (d.montant || 0), 0);
        const montantDemandes = (demandes || []).reduce((sum: number, d: any) => sum + (d.montantCollecte || 0), 0);
        const montantTotal = montantFinancierTotal > 0 ? montantFinancierTotal : montantDemandes;

        const enAttente = (demandes || []).filter((d: any) => d.statut === 'EN_ATTENTE' || !d.statut).length;
        const validees = (demandes || []).filter((d: any) => d.statut === 'VALIDEE' || d.statut === 'Validé' || d.statut === 'TERMINEE').length;
        const refusees = (demandes || []).filter((d: any) => d.statut === 'REFUSEE' || d.statut === 'Refusé' || d.statut === 'REJETEE').length;

        const totalDonsCount = Math.max((donsFinanciers || []).length, (donsGlobaux || []).length);

        this.listeDonsFinanciers = donsFinanciers || [];

        this.stats = {
          totalOrganisations: (organisations || []).length,
          totalBeneficiaires: (beneficiaires || []).length,
          totalDemandesAide: (demandes || []).length,
          totalDons: totalDonsCount,
          montantTotalCollecte: montantTotal,
          demandesEnAttente: enAttente,
          demandesValidees: validees,
          demandesRefusees: refusees
        };

        this.actualiserGraphiqueDons();

        if (this.stats.totalOrganisations === 0 && tentative <= 2) {
          setTimeout(() => this.chargerStatsFallback(tentative + 1), 2000);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.warn('Erreur chargement des stats dashboard fallback', err);
        if (tentative <= 3) {
          setTimeout(() => this.chargerStatsFallback(tentative + 1), 2000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  parseDateSafe(val: any): Date {
    if (!val) return new Date();
    if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
    if (Array.isArray(val)) {
      const year = val[0] || new Date().getFullYear();
      const month = val[1] !== undefined ? val[1] - 1 : 0;
      const day = val[2] || 1;
      const hours = val[3] || 0;
      const minutes = val[4] || 0;
      return new Date(year, month, day, hours, minutes);
    }
    if (typeof val === 'string') {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) return parsed;
      const parts = val.split(/[-/T :]/);
      if (parts.length >= 3) {
        if (parts[0].length === 4) return new Date(+parts[0], +parts[1] - 1, +parts[2]);
        return new Date(+parts[2], +parts[1] - 1, +parts[0]);
      }
    }
    return new Date();
  }

  chargerDemandes(tentative = 1) {
    this.demandeService.getDemandes().subscribe({
      next: (demandes: any[]) => {
        if (demandes && demandes.length > 0) {
          this.projetsDons = demandes.map((d: any) => {
            const rawStatut = (d.statut || '').toUpperCase();
            const isTermine = rawStatut === 'TERMINEE' || rawStatut === 'TERMINE';
            const isValide = rawStatut === 'VALIDEE' || rawStatut === 'VALIDE';
            const isRefuse = rawStatut === 'REFUSEE' || rawStatut === 'REFUSE' || rawStatut === 'REJETEE' || rawStatut === 'REJETE';
            const statut = isTermine ? 'Terminé' : (isValide ? 'Validé' : (isRefuse ? 'Rejeté' : 'En attente'));
            const statutClass = isTermine || isValide ? 'status-termine' : (isRefuse ? 'priority-urgente' : 'status-attente');

            const urgence = d.niveauUrgence === 'FORTE' ? 'Urgente' : (d.niveauUrgence === 'MOYENNE' ? 'Moyenne' : 'Basse');
            const urgenceClass = d.niveauUrgence === 'FORTE' ? 'priority-urgente' : (d.niveauUrgence === 'MOYENNE' ? 'priority-moyenne' : 'priority-basse');

            const typeAide = d.typeDemandeAide || (d.montantNecessaire ? 'FINANCIERE' : 'MATERIELLE');
            const catNom = d.categorieDemandeNom || 'Social & Solidarité';
            const parsedDate = this.parseDateSafe(d.dateCreation || d.dateValidation);

            return {
              id: d.id,
              nom: d.titre || 'Demande d\'aide solidaire',
              localisation: d.motif ? `Région de ${d.motif}` : 'Bamako',
              type: catNom,
              typeAide: typeAide,
              statut: statut,
              statutClass: statutClass,
              date: parsedDate.toLocaleDateString('fr-FR'),
              rawDate: parsedDate,
              montantNecessaire: Number(d.montantNecessaire) || (typeAide === 'FINANCIERE' ? 50000 : 25000),
              montantCollecte: Number(d.montantCollecte) || 0,
              priorite: urgence,
              prioriteClass: urgenceClass,
              beneficiaireNom: `${d.beneficiairePrenom || ''} ${d.beneficiaireNom || ''}`.trim() || 'Bénéficiaire',
              beneficiairePhone: '+223 70 00 00 00'
            };
          });

          this.actualiserCategories();
          this.actualiserRepartitionAide();
          this.actualiserGraphiqueDons();
        } else {
          this.projetsDons = [];
          if (tentative <= 2) {
            setTimeout(() => this.chargerDemandes(tentative + 1), 2000);
          }
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.projetsDons = [];
        console.warn('Erreur chargement des demandes dashboard', err);
        if (tentative <= 3) {
          setTimeout(() => this.chargerDemandes(tentative + 1), 2000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  actualiserCategories() {
    const baseCats = ['Santé & Médical', 'Alimentaire', 'Éducation', 'Logement', 'Social'];
    const set = new Set<string>(baseCats);
    this.projetsDons.forEach(p => {
      if (p.type && p.type.trim()) {
        set.add(p.type.trim());
      }
    });
    this.listeCategories = Array.from(set);
  }

  // ==========================================
  // GRAPHIQUE DYNAMIQUE : Aperçu des Dons & Aides
  // ==========================================
  onPeriodChange() {
    this.actualiserGraphiqueDons();
    this.cdr.detectChanges();
  }

  setChartMetric(metric: 'dons' | 'demandes') {
    this.chartMetric = metric;
    this.actualiserGraphiqueDons();
    this.cdr.detectChanges();
  }

  actualiserGraphiqueDons() {
    const now = new Date();
    let labels: string[] = [];
    let values: number[] = [];

    // Déterminer la source de données selon la métrique sélectionnée
    const sourceData: { date: Date; montant: number }[] = this.chartMetric === 'dons'
      ? (this.listeDonsFinanciers && this.listeDonsFinanciers.length > 0
          ? this.listeDonsFinanciers.map(d => ({
              date: this.parseDateSafe(d.dateDon || d.dateCreation || d.date),
              montant: Number(d.montant) || Number(d.valeurEstimee) || 0
            }))
          : (this.stats.montantTotalCollecte > 0
              ? [{ date: now, montant: this.stats.montantTotalCollecte }]
              : []))
      : (this.projetsDons || []).map(p => ({
          date: this.parseDateSafe(p.rawDate),
          montant: Number(p.montantNecessaire) || (p.typeAide === 'FINANCIERE' ? 50000 : 25000)
        }));

    if (this.selectedPeriod === 'cette semaine') {
      labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      values = [0, 0, 0, 0, 0, 0, 0];

      // Trouver le lundi de la semaine en cours
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(monday);
        dayStart.setDate(monday.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);

        const daySum = sourceData
          .filter(item => item.date >= dayStart && item.date < dayEnd)
          .reduce((sum, item) => sum + item.montant, 0);

        values[i] = daySum;
      }
    } else if (this.selectedPeriod === 'ce mois') {
      labels = ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'];
      values = [0, 0, 0, 0];

      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const intervals = [
        { start: 1, end: 7 },
        { start: 8, end: 14 },
        { start: 15, end: 21 },
        { start: 22, end: 32 }
      ];

      const monthItems = sourceData.filter(item =>
        item.date.getFullYear() === currentYear && item.date.getMonth() === currentMonth
      );

      intervals.forEach((inter, idx) => {
        values[idx] = monthItems
          .filter(item => {
            const dayNum = item.date.getDate();
            return dayNum >= inter.start && dayNum <= inter.end;
          })
          .reduce((sum, item) => sum + item.montant, 0);
      });
    } else {
      // cette année
      labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      values = new Array(12).fill(0);

      const currentYear = now.getFullYear();
      const yearItems = sourceData.filter(item => item.date.getFullYear() === currentYear);

      for (let m = 0; m < 12; m++) {
        values[m] = yearItems
          .filter(item => item.date.getMonth() === m)
          .reduce((sum, item) => sum + item.montant, 0);
      }
    }

    this.currentPeriodTotal = values.reduce((sum, v) => sum + v, 0);

    const xMin = 35;
    const xMax = 465;
    const yTop = 25;
    const yBottom = 155;

    const maxVal = Math.max(...values, 1);
    const stepX = labels.length > 1 ? (xMax - xMin) / (labels.length - 1) : 0;

    const points: ChartPoint[] = labels.map((lbl, i) => {
      const x = Math.round(xMin + i * stepX);
      const val = values[i];
      const y = (maxVal === 1 && val === 0)
        ? yBottom
        : Math.round(yBottom - (val / maxVal) * (yBottom - yTop));

      return {
        x,
        y,
        label: lbl,
        value: val,
        formattedValue: val.toLocaleString('fr-FR') + ' FCFA'
      };
    });

    this.chartPoints = points;

    // Calcul de la courbe lisse Catmull-Rom vers Bézier cubique
    if (points.length >= 2) {
      let d = `M ${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
      }
      this.chartCurvePath = d;
      this.chartAreaPath = `${d} L ${points[points.length - 1].x},${yBottom} L ${points[0].x},${yBottom} Z`;
    } else {
      this.chartCurvePath = '';
      this.chartAreaPath = '';
    }
  }

  // ==========================================
  // GRAPHIQUE DYNAMIQUE : Répartition de l'Aide
  // ==========================================
  actualiserRepartitionAide() {
    // Toujours calculer la distribution globale sur l'ensemble des demandes pour conserver la vue d'ensemble intacte
    const allDemandes = this.projetsDons;
    const totalCount = allDemandes.length;

    const categoryColors: { [key: string]: string } = {
      'ALIMENTATION': '#FDBA12',
      'ALIMENTAIRE': '#FDBA12',
      'LOGEMENT': '#D97706',
      'SANTÉ': '#0F7A4B',
      'SANTÉ & MÉDICAL': '#0F7A4B',
      'ÉDUCATION': '#16A34A',
      'SCOLAIRE': '#16A34A',
      'SOCIAL': '#2563EB',
      'SOCIAL & SOLIDARITÉ': '#2563EB'
    };

    const counts: { [cat: string]: number } = {};

    allDemandes.forEach(p => {
      const cat = (p.type || 'Social & Solidarité').trim();
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const entries = Object.keys(counts).map(cat => ({
      label: cat,
      count: counts[cat]
    }));

    // Trier les catégories par nombre de demandes décroissant
    entries.sort((a, b) => b.count - a.count);

    let cumulative = 0;
    const items: AidDistributionItem[] = [];

    entries.forEach(entry => {
      const percent = totalCount > 0 ? Math.round((entry.count / totalCount) * 100) : 0;
      const upper = entry.label.toUpperCase();
      let color = categoryColors[upper];
      if (!color) {
        if (upper.includes('ALIM')) color = '#FDBA12';
        else if (upper.includes('LOG')) color = '#D97706';
        else if (upper.includes('SANT')) color = '#0F7A4B';
        else if (upper.includes('EDUC') || upper.includes('ÉDUC')) color = '#16A34A';
        else color = '#2563EB';
      }

      items.push({
        label: entry.label,
        count: entry.count,
        percent: percent,
        color: color,
        strokeDasharray: `${percent} ${100 - percent}`,
        strokeDashoffset: -cumulative
      });
      cumulative += percent;
    });

    // Ajustement de somme à 100%
    if (items.length > 0 && cumulative !== 100 && totalCount > 0) {
      items[0].percent += (100 - cumulative);
      const p = items[0].percent;
      items[0].strokeDasharray = `${p} ${100 - p}`;
    }

    this.repartitionAide = items;
  }

  get selectedCategoryItem(): AidDistributionItem | null {
    if (!this.categorieSelectionnee) return null;
    return this.repartitionAide.find(i => i.label.toLowerCase() === this.categorieSelectionnee.toLowerCase()) || null;
  }

  // ==========================================
  // FILTRAGE ET TRI DES DEMANDES
  // ==========================================
  get projetsDonsFiltres(): DashboardProjetItem[] {
    let result = [...this.projetsDons];

    // 1. Recherche texte
    if (this.recherche && this.recherche.trim()) {
      const q = this.recherche.toLowerCase().trim();
      result = result.filter(p =>
        (p.nom && p.nom.toLowerCase().includes(q)) ||
        (p.localisation && p.localisation.toLowerCase().includes(q)) ||
        (p.beneficiaireNom && p.beneficiaireNom.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q))
      );
    }

    // 2. Type d'aide
    if (this.typeAideSelectionne) {
      const selType = this.typeAideSelectionne.toUpperCase();
      result = result.filter(p => {
        const t = (p.typeAide || '').toUpperCase();
        return selType === 'FINANCIERE' ? t.includes('FINANC') : t.includes('MATER');
      });
    }

    // 3. Catégorie
    if (this.categorieSelectionnee) {
      const selCat = this.categorieSelectionnee.toLowerCase();
      result = result.filter(p => (p.type || '').toLowerCase().includes(selCat));
    }

    // 4. Urgence
    if (this.urgenceSelectionnee) {
      const selUrg = this.urgenceSelectionnee.toUpperCase();
      result = result.filter(p => {
        const u = (p.priorite || '').toUpperCase();
        if (selUrg === 'FORTE') return u.includes('URGENT') || u.includes('FORT');
        if (selUrg === 'MOYENNE') return u.includes('MOYEN');
        if (selUrg === 'FAIBLE') return u.includes('BASS') || u.includes('FAIBL');
        return true;
      });
    }

    // 5. Statut
    if (this.statutSelectionne) {
      const selStat = this.statutSelectionne.toUpperCase();
      result = result.filter(p => {
        const s = (p.statut || '').toUpperCase();
        if (selStat === 'EN_ATTENTE') return s.includes('ATTENTE');
        if (selStat === 'VALIDEE') return s.includes('VALID');
        if (selStat === 'TERMINEE') return s.includes('TERMIN');
        if (selStat === 'REFUSEE') return s.includes('REFUS') || s.includes('REJET');
        return true;
      });
    }

    return result;
  }

  // ==========================================
  // PAGINATION (10 par page, mode défilement)
  // ==========================================
  pageActuelle: number = 1;
  elementsParPage: number = 10;

  get totalPages(): number {
    return Math.ceil(this.projetsDonsFiltres.length / this.elementsParPage) || 1;
  }

  get pages(): number[] {
    const arr: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      arr.push(i);
    }
    return arr;
  }

  get demandesPaginees(): DashboardProjetItem[] {
    const startIndex = (this.pageActuelle - 1) * this.elementsParPage;
    return this.projetsDonsFiltres.slice(startIndex, startIndex + this.elementsParPage);
  }

  allerPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageActuelle = page;
      this.cdr.detectChanges();
    }
  }

  pagePrecedente() {
    if (this.pageActuelle > 1) {
      this.pageActuelle--;
      this.cdr.detectChanges();
    }
  }

  pageSuivante() {
    if (this.pageActuelle < this.totalPages) {
      this.pageActuelle++;
      this.cdr.detectChanges();
    }
  }

  onFiltreChange() {
    this.pageActuelle = 1;
    this.actualiserRepartitionAide();
    this.actualiserGraphiqueDons();
    this.cdr.detectChanges();
  }

  reinitialiserFiltres() {
    this.pageActuelle = 1;
    this.recherche = '';
    this.typeAideSelectionne = '';
    this.categorieSelectionnee = '';
    this.urgenceSelectionnee = '';
    this.statutSelectionne = '';
    this.actualiserRepartitionAide();
    this.actualiserGraphiqueDons();
    this.cdr.detectChanges();
  }

  filtrerParCategorie(catLabel: string) {
    this.pageActuelle = 1;
    if (this.categorieSelectionnee.toLowerCase() === catLabel.toLowerCase()) {
      this.categorieSelectionnee = '';
    } else {
      this.categorieSelectionnee = catLabel;
    }
    this.onFiltreChange();
  }

  toggleSortDate() {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.projetsDons.reverse();
    this.cdr.detectChanges();
  }
}

