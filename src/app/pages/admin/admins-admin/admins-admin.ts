import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UtilisateurService, UtilisateurRequest } from '../../../services/utilisateur.service';
import { User } from '../../../models/utilisateur.model';
import { NotificationService } from '../../../services/notification';
import { AuthService } from '../../../services/auth.service';

export interface AdminItem {
  id: string;
  rawId: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  telephone: string;
  email?: string;
  role: string;
  dateInscription: string;
  statut: 'Actif' | 'Désactivé';
  statutClass: string;
}

@Component({
  selector: 'app-admins-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admins-admin.html',
  styleUrl: './admins-admin.css',
})
export class AdminsAdmin implements OnInit {
  // Vue active : 'LISTE' | 'NOUVEAU' | 'DETAILS'
  vueActive: 'LISTE' | 'NOUVEAU' | 'DETAILS' = 'LISTE';

  admins: AdminItem[] = [];
  isLoading = false;
  searchTerm = '';
  filtreStatut = '';

  // Consultation détails
  adminSelectionne: AdminItem | null = null;

  // Formulaire Nouvel Admin
  nouvelAdmin: UtilisateurRequest & { email?: string; confirmerMotDePasse?: string } = {
    nom: '',
    prenom: '',
    telephone: '',
    motDePasse: '',
    confirmerMotDePasse: '',
    email: '',
    role: 'ADMIN'
  };
  erreurFormulaire = '';
  succesMessage = '';
  isSubmitting = false;

  // Notification Toast / Modal en haut de l'écran (Style Organisation Partenaire)
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  private notificationTimer: any = null;

  // Modal de confirmation de désactivation / archivage
  isArchiveModalOpen = false;
  adminAArchiver: AdminItem | null = null;

  // Clé pour le stockage local des administrateurs archivés
  private readonly STORAGE_ARCHIVED_KEY = 'deme_mali_archived_admins';

  // Contrôle d'accès : Réservé exclusivement à l'administrateur par défaut du backend
  isSuperAdmin = false;

  constructor(
    private utilisateurService: UtilisateurService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    if (this.isSuperAdmin) {
      this.chargerAdmins();
    }
  }

  // Vérifier si un compte est l'administrateur principal créé par défaut dans le backend
  estAdminParDefaut(admin: AdminItem | null): boolean {
    if (!admin) return false;
    const tel = (admin.telephone || '').replace(/\D/g, '');
    return tel.endsWith('77990488') || admin.rawId === 1 || (admin.nom === 'Coulibaly' && admin.prenom === 'Ibrahim');
  }

  // --- Chargement des administrateurs depuis l'API backend ---
  chargerAdmins(tentative = 1) {
    this.isLoading = true;
    this.utilisateurService.getAllUtilisateurs().subscribe({
      next: (utilisateurs: User[]) => {
        this.isLoading = false;
        const archivedIds = this.getArchivedIds();

        this.admins = (utilisateurs || [])
          .filter((u: User) => u.role === 'ADMIN')
          .map((u: User) => {
            const isDesactive = archivedIds.has(u.id);
            const statut: 'Actif' | 'Désactivé' = isDesactive ? 'Désactivé' : 'Actif';
            const statutClass = isDesactive ? 'status-refuse' : 'status-approuve';

            return {
              id: 'ADM' + String(u.id).padStart(3, '0'),
              rawId: u.id,
              nom: u.nom || '',
              prenom: u.prenom || '',
              nomComplet: `${u.prenom || ''} ${u.nom || ''}`.trim() || 'Administrateur',
              telephone: u.telephone || '+223 70 00 00 00',
              email: (u as any).email || '',
              role: 'Administrateur Plateforme',
              dateInscription: 'Compte actif',
              statut: statut,
              statutClass: statutClass
            };
          });

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Erreur chargement des administrateurs', err);
        if (tentative <= 3) {
          setTimeout(() => this.chargerAdmins(tentative + 1), 2000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Gestion du statut archivé / désactivé dans localStorage
  private getArchivedIds(): Set<number> {
    try {
      const data = localStorage.getItem(this.STORAGE_ARCHIVED_KEY);
      if (data) {
        return new Set(JSON.parse(data));
      }
    } catch (e) {
      console.warn('Erreur lecture admins archivés', e);
    }
    return new Set<number>();
  }

  private saveArchivedIds(ids: Set<number>) {
    try {
      localStorage.setItem(this.STORAGE_ARCHIVED_KEY, JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.warn('Erreur sauvegarde admins archivés', e);
    }
  }

  // Filtrage
  get adminsFiltres(): AdminItem[] {
    return this.admins.filter(a => {
      // Filtre statut
      if (this.filtreStatut) {
        if (this.filtreStatut === 'ACTIF' && a.statut !== 'Actif') return false;
        if (this.filtreStatut === 'DESACTIVE' && a.statut !== 'Désactivé') return false;
      }

      // Recherche
      if (this.searchTerm && this.searchTerm.trim()) {
        const q = this.searchTerm.toLowerCase().trim();
        const matchNom = a.nomComplet.toLowerCase().includes(q);
        const matchTel = a.telephone.toLowerCase().includes(q);
        const matchId = a.id.toLowerCase().includes(q);
        if (!matchNom && !matchTel && !matchId) return false;
      }

      return true;
    });
  }

  // Navigation vers la page d'ajout
  allerVersNouveau() {
    if (!this.isSuperAdmin) {
      this.afficherNotification('Action non autorisée : seul le super-administrateur peut créer un compte.', 'error');
      return;
    }
    this.erreurFormulaire = '';
    this.succesMessage = '';
    this.nouvelAdmin = {
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      motDePasse: '',
      confirmerMotDePasse: '',
      role: 'ADMIN'
    };
    this.vueActive = 'NOUVEAU';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Navigation vers les détails
  ouvrirDetails(admin: AdminItem) {
    this.adminSelectionne = admin;
    this.vueActive = 'DETAILS';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Retour vers la liste (conserve la notification active)
  retourListe() {
    this.vueActive = 'LISTE';
    this.adminSelectionne = null;
    this.erreurFormulaire = '';
    this.succesMessage = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Affichage du modal / toast de notification en haut de l'écran
  afficherNotification(message: string, type: 'success' | 'error' = 'success') {
    this.notificationMessage = message;
    this.notificationType = type;

    // Déclenche également le NotificationService commun à l'organisation partenaire
    if (type === 'success') {
      this.notificationService.succes(message);
    } else {
      this.notificationService.erreur(message);
    }

    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }

    this.notificationTimer = setTimeout(() => {
      this.notificationMessage = '';
      this.cdr.detectChanges();
    }, 5000);

    this.cdr.detectChanges();
  }

  fermerNotification() {
    this.notificationMessage = '';
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }
    this.cdr.detectChanges();
  }

  // --- Enregistrement d'un nouvel administrateur ---
  enregistrerAdmin() {
    this.erreurFormulaire = '';
    this.succesMessage = '';

    const prenom = (this.nouvelAdmin.prenom || '').trim();
    const nom = (this.nouvelAdmin.nom || '').trim();
    const telephone = (this.nouvelAdmin.telephone || '').trim();
    const motDePasse = this.nouvelAdmin.motDePasse || '';
    const confirmer = this.nouvelAdmin.confirmerMotDePasse || '';

    if (!prenom || !nom) {
      this.erreurFormulaire = 'Veuillez saisir le prénom et le nom de famille de l\'administrateur.';
      this.afficherNotification(this.erreurFormulaire, 'error');
      return;
    }

    if (!telephone) {
      this.erreurFormulaire = 'Le numéro de téléphone est obligatoire (il sert d\'identifiant de connexion).';
      this.afficherNotification(this.erreurFormulaire, 'error');
      return;
    }

    if (motDePasse.length < 8) {
      this.erreurFormulaire = 'Le mot de passe doit comporter au moins 8 caractères.';
      this.afficherNotification(this.erreurFormulaire, 'error');
      return;
    }

    if (motDePasse !== confirmer) {
      this.erreurFormulaire = 'La confirmation du mot de passe ne correspond pas.';
      this.afficherNotification(this.erreurFormulaire, 'error');
      return;
    }

    this.isSubmitting = true;
    this.utilisateurService.ajouterUtilisateur({
      nom: nom,
      prenom: prenom,
      telephone: telephone,
      motDePasse: motDePasse,
      role: 'ADMIN'
    }).subscribe({
      next: (createdUser: User) => {
        this.isSubmitting = false;
        const msgSucces = `Le compte administrateur pour ${prenom} ${nom} a été créé avec succès !`;
        this.succesMessage = msgSucces;
        this.afficherNotification(msgSucces, 'success');

        // Réinitialiser le formulaire
        this.nouvelAdmin = {
          nom: '',
          prenom: '',
          telephone: '',
          motDePasse: '',
          confirmerMotDePasse: '',
          email: '',
          role: 'ADMIN'
        };

        setTimeout(() => {
          this.retourListe();
          this.chargerAdmins();
        }, 1200);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur création admin', err);
        const detail = err.error?.message || err.error?.detail || '';
        if (err.status === 409 || detail.toLowerCase().includes('telephone') || detail.toLowerCase().includes('existe')) {
          this.erreurFormulaire = 'Ce numéro de téléphone est déjà associé à un compte existant.';
        } else {
          this.erreurFormulaire = detail || 'Une erreur est survenue lors de la création de l\'administrateur.';
        }
        this.afficherNotification(this.erreurFormulaire, 'error');
      }
    });
  }

  // --- Désactivation / Archivage (NE SUPPRIME PAS DE LA BD) ---
  demanderDesactivation(admin: AdminItem) {
    if (!this.isSuperAdmin) {
      this.afficherNotification('Action non autorisée : seul le super-administrateur peut désactiver un compte.', 'error');
      return;
    }
    if (this.estAdminParDefaut(admin)) {
      this.afficherNotification('Impossible de désactiver le compte de l\'administrateur principal par défaut.', 'error');
      return;
    }
    this.adminAArchiver = admin;
    this.isArchiveModalOpen = true;
  }

  fermerArchiveModal() {
    this.isArchiveModalOpen = false;
    this.adminAArchiver = null;
  }

  confirmerArchivage() {
    if (!this.isSuperAdmin) {
      this.afficherNotification('Action non autorisée.', 'error');
      return;
    }
    if (!this.adminAArchiver) return;
    const admin = this.adminAArchiver;
    if (this.estAdminParDefaut(admin)) {
      this.afficherNotification('Action interdite sur l\'administrateur principal.', 'error');
      this.fermerArchiveModal();
      return;
    }
    const archivedIds = this.getArchivedIds();

    archivedIds.add(admin.rawId);
    this.saveArchivedIds(archivedIds);

    admin.statut = 'Désactivé';
    admin.statutClass = 'status-refuse';

    if (this.adminSelectionne && this.adminSelectionne.rawId === admin.rawId) {
      this.adminSelectionne.statut = 'Désactivé';
      this.adminSelectionne.statutClass = 'status-refuse';
    }

    this.fermerArchiveModal();
    this.afficherNotification(`Le compte de ${admin.nomComplet} a été désactivé.`, 'error');
    this.cdr.detectChanges();
  }

  // --- Réactivation d'un compte archivé ---
  reactiverAdmin(admin: AdminItem) {
    if (!this.isSuperAdmin) {
      this.afficherNotification('Action non autorisée : seul le super-administrateur peut réactiver un compte.', 'error');
      return;
    }
    const archivedIds = this.getArchivedIds();
    archivedIds.delete(admin.rawId);
    this.saveArchivedIds(archivedIds);

    admin.statut = 'Actif';
    admin.statutClass = 'status-approuve';

    if (this.adminSelectionne && this.adminSelectionne.rawId === admin.rawId) {
      this.adminSelectionne.statut = 'Actif';
      this.adminSelectionne.statutClass = 'status-approuve';
    }

    this.afficherNotification(`Le compte de ${admin.nomComplet} a été réactivé avec succès.`, 'success');
    this.cdr.detectChanges();
  }
}
