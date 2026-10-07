/*import { Component } from '@angular/core';

@Component({
  selector: 'app-list-demandes',
  imports: [],
  templateUrl: './list-demandes.html',
  styleUrl: './list-demandes.css',
})
export class ListDemandes {
  demandes: Demande[] = [];

  categories: any[] = [];
  urgences: any[] = [];
  statuts: any[] = [];

  categorieSelectionnee = '';
  urgenceSelectionnee = '';
  statutSelectionne = '';
  recherche = '';

  total = 0;
  refusees = 0;
  enAttente = 0;
  traitees = 0;

  chargement = false;

  organisationId = 1;

  constructor(
    private demandeService: DemandeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerDemandes();
    this.chargerFiltres();
  }

  chargerDemandes(): void {

    this.chargement = true;

    this.demandeService
      .getDemandes(this.organisationId)
      .subscribe({
        next: (response) => {

          this.demandes = response.demandes;
          this.total = response.total;
          this.refusees = response.refusees;
          this.enAttente = response.enAttente;
          this.traitees = response.traitees;

          this.chargement = false;
        },
        error: (error) => {

          console.error(error);

          this.chargement = false;
        }
      });
  }

  chargerFiltres(): void {

    this.demandeService
      .getFiltres(this.organisationId)
      .subscribe({
        next: (response: DemandeFiltres) => {

          this.categories = response.categories;
          this.urgences = response.urgences;
          this.statuts = response.statuts;
        },
        error: (error) => {
          console.error(error);
        }
      });
  }

  filtrer(): void {

    this.chargement = true;

    this.demandeService
      .filtrerDemandes(
        this.organisationId,
        this.categorieSelectionnee,
        this.urgenceSelectionnee,
        this.statutSelectionne,
        this.recherche
      )
      .subscribe({
        next: (response) => {

          this.demandes = response.demandes;
          this.total = response.total;
          this.refusees = response.refusees;
          this.enAttente = response.enAttente;
          this.traitees = response.traitees;

          this.chargement = false;
        },
        error: (error) => {

          console.error(error);

          this.chargement = false;
        }
      });
  }

  nouvelleDemande(): void {

    this.router.navigate([
      '/ajouter-demande'
    ]);
  }

  voirDemande(demande: Demande): void {

    console.log(demande);
  }
}
*/