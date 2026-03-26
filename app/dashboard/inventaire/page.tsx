'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePieces, useFournisseurs, useUnites, useCategories, useTransactions } from '@/app/hooks/useInventaire';
import type { Piece, FournisseurInv, UniteInv, CategorieInv, Transaction, VueInventaire } from '@/app/api/inventaire/PieceSchema';
import SlidePanel from '@/app/components/inventaire/Slidepanel';
import { KebabMenu, ConfirmDialog, ToastProvider, useToast } from '@/app/components/inventaire/Shareui';

// Liste des types d'achat (identique à celle du module achats)
const TYPE_ACHAT_LIST = ['FIBRE', 'LIMONS', 'VERRES', 'COLONNES', 'PEINTURE', 'ATTACHES', 'PLANCHER_ALUMINIUM', 'AUTRE'] as const;

// ╔══════════════════════════════════════════════════════╗
// ║           PAGE INVENTAIRE - RAMPES GARDEX            ║
// ╚══════════════════════════════════════════════════════╝

function InventaireContent() {
  const { toast } = useToast();

  // === HOOKS DATA ===
  const { pieces, loading: loadingPieces, stats, charger: chargerPieces, creer: creerPiece, modifier: modifierPiece, supprimer: supprimerPiece } = usePieces();
  const { fournisseurs, charger: chargerFournisseurs, creer: creerFournisseur, modifier: modifierFournisseur, supprimer: supprimerFournisseur } = useFournisseurs();
  const { unites, charger: chargerUnites, creer: creerUnite, modifier: modifierUnite, supprimer: supprimerUnite } = useUnites();
  const { categories, charger: chargerCategories, creer: creerCategorie } = useCategories();
  const { transactions, charger: chargerTransactions, creer: creerTransaction } = useTransactions();

  // === ÉTATS VUE ===
  const [vueActive, setVueActive] = useState<VueInventaire>('liste');

  // === ÉTATS MODALS (listes) ===
  const [showPiecesModal, setShowPiecesModal] = useState(false);
  const [showFournisseursModal, setShowFournisseursModal] = useState(false);
  const [showUnitesModal, setShowUnitesModal] = useState(false);
  const [recherchePiecesModal, setRecherchePiecesModal] = useState(''); // Recherche dans modal Pièces

  // === ÉTATS SLIDE PANELS (create/edit) ===
  const [slidePiece, setSlidePiece] = useState<{ ouvert: boolean; piece: Piece | null }>({ ouvert: false, piece: null });
  const [slideFournisseur, setSlideFournisseur] = useState<{ ouvert: boolean; fournisseur: FournisseurInv | null }>({ ouvert: false, fournisseur: null });

  // === ÉTATS FILTRES ===
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [filtreFournisseur, setFiltreFournisseur] = useState('');
  const [filtrePointCommande, setFiltrePointCommande] = useState(false);
  const [rechercheTransaction, setRechercheTransaction] = useState('');
  const [dateTransaction, setDateTransaction] = useState('');
  const [recherchePiece, setRecherchePiece] = useState('');

  // === ÉTAT TRANSACTION ===
  type TypeTransaction = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT' | 'SORTIE_PEINTURE';
  const [pieceSelectionnee, setPieceSelectionnee] = useState<Piece | null>(null);
  const [transaction, setTransaction] = useState<{ type: TypeTransaction; quantite: number }>({ type: 'ENTREE', quantite: 0 });
  const [piecePeinteSelectionnee, setPiecePeinteSelectionnee] = useState<Piece | null>(null); // Pour Sortie-Peinture

  // === ÉTAT COMMANDES DE PEINTURE EN ATTENTE DE RÉCEPTION ===
  interface CommandePeinture {
    id: number;
    produitPeintId: string;
    code: string;
    description: string;
    quantite: number;
    dateDepart: Date;
    ordre: number;
  }
  const [commandesPeinture, setCommandesPeinture] = useState<CommandePeinture[]>([]);

  // === ÉTAT CONFIRM ===
  const [confirm, setConfirm] = useState<{ ouvert: boolean; titre: string; message: string; onConfirm: () => void }>({
    ouvert: false, titre: '', message: '', onConfirm: () => {},
  });

  // === ÉTAT NOUVELLE UNITE (inline dans modal) ===
  const [nouvelleUnite, setNouvelleUnite] = useState({ unite: '', qtePar: 1, description: '' });

  // === FORMULAIRE PIÈCE ===
  const [formPiece, setFormPiece] = useState({
    code: '', nom: '', description: '', couleur: '', categoriePieceId: '', uniteId: '',
    fournisseurId: '', seuilMin: 0, prixUnitaire: undefined as number | undefined,
    piecePeinte: false, codePieceNonPeinte: '', emplacement: '', emplacement2: '',
  });

  // === FORMULAIRE FOURNISSEUR (avec nouveaux champs) ===
  const [formFournisseur, setFormFournisseur] = useState({
    nom: '', contact: '', telephone: '', email: '', adresse: '', notes: '',
    typeAchat: '', formulaireFile: null as File | null,
    supprimerFormulaire: false, formulaireNom: '', formulaireMime: '',
  });

  // === CHARGEMENT INITIAL ===
  useEffect(() => {
    chargerPieces();
    chargerFournisseurs();
    chargerUnites();
    chargerCategories();
    chargerTransactions();
  }, [chargerPieces, chargerFournisseurs, chargerUnites, chargerCategories, chargerTransactions]);

  // === Mettre à jour la pièce sélectionnée quand la liste des pièces change (pour garder l'objet à jour) ===
  useEffect(() => {
    if (pieceSelectionnee) {
      const updatedPiece = pieces.find(p => p.id === pieceSelectionnee.id);
      if (updatedPiece) setPieceSelectionnee(updatedPiece);
      else setPieceSelectionnee(null);
    }
  }, [pieces, pieceSelectionnee]);

  // === HELPERS ===
  const formaterDate = useCallback((dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  const getCouleurStock = useCallback((inventaire: number, pointCommande: number) => {
    if (pointCommande === 0) return 'bg-white';
    if (inventaire <= 0) return 'bg-red-100';
    if (inventaire <= pointCommande) return 'bg-yellow-100';
    return 'bg-green-100';
  }, []);

  const getCouleurPointCommande = useCallback((inventaire: number, pointCommande: number) => {
    if (pointCommande === 0) return 'text-slate-600';
    if (inventaire <= pointCommande) return 'text-red-600 font-bold';
    return 'text-green-600';
  }, []);

  const getTypeLabel = useCallback((type: string) => {
    const map: Record<string, string> = {
      ENTREE: 'Entrée', SORTIE: 'Sortie', AJUSTEMENT: 'Mise à jour',
      SORTIE_PEINTURE: 'Sortie-Peinture', TRANSFERT: 'Transfert', RETOUR: 'Retour',
    };
    return map[type] || type;
  }, []);

  // === FILTRAGE LOCAL (mémorisé) ===
  const piecesFiltrees = useMemo(() => {
    return pieces.filter((piece) => {
      const matchRecherche = !recherche ||
        piece.code.toLowerCase().includes(recherche.toLowerCase()) ||
        piece.nom.toLowerCase().includes(recherche.toLowerCase());
      const matchCategorie = !filtreCategorie || piece.categoriePieceId === filtreCategorie;
      const matchFournisseur = !filtreFournisseur || piece.fournisseurId === filtreFournisseur;
      const matchPointCommande = !filtrePointCommande || (piece.quantite <= piece.seuilMin && piece.seuilMin > 0);
      return matchRecherche && matchCategorie && matchFournisseur && matchPointCommande;
    });
  }, [pieces, recherche, filtreCategorie, filtreFournisseur, filtrePointCommande]);

  const transactionsFiltrees = useMemo(() => {
    return transactions.filter((trans) => {
      const matchRecherche = !rechercheTransaction ||
        trans.produit?.code.toLowerCase().includes(rechercheTransaction.toLowerCase()) ||
        trans.produit?.nom.toLowerCase().includes(rechercheTransaction.toLowerCase());
      const matchDate = !dateTransaction || trans.createdAt >= dateTransaction;
      return matchRecherche && matchDate;
    });
  }, [transactions, rechercheTransaction, dateTransaction]);

  // Liste des pièces pour la sélection (avec filtre recherchePiece)
  const piecesPourSelection = useMemo(() => {
    return pieces.filter((p) =>
      !recherchePiece ||
      p.code.toLowerCase().includes(recherchePiece.toLowerCase()) ||
      p.nom.toLowerCase().includes(recherchePiece.toLowerCase())
    );
  }, [pieces, recherchePiece]);

  // Liste des pièces non peintes (celles qu'on peut envoyer à la peinture)
  const piecesNonPeintes = useMemo(() => {
    return piecesPourSelection.filter(p => !p.piecePeinte);
  }, [piecesPourSelection]);

  // Pour Sortie-Peinture : liste des pièces peintes qui correspondent à la pièce non peinte sélectionnée
  const piecesPeintesAssociees = useMemo(() => {
    if (!pieceSelectionnee || !pieceSelectionnee.code) return [];
    return pieces.filter(p => p.piecePeinte && p.codePieceNonPeinte === pieceSelectionnee.code);
  }, [pieces, pieceSelectionnee]);

  // Liste des pièces pour le modal (avec recherche)
  const piecesModalFiltrees = useMemo(() => {
    return pieces.filter(p =>
      p.code.toLowerCase().includes(recherchePiecesModal.toLowerCase()) ||
      p.nom.toLowerCase().includes(recherchePiecesModal.toLowerCase())
    );
  }, [pieces, recherchePiecesModal]);

  // === ACTIONS CRUD (mémorisées) ===
  const ouvrirAjouterPiece = useCallback(() => {
    setFormPiece({
      code: '', nom: '', description: '', couleur: '', categoriePieceId: '', uniteId: '',
      fournisseurId: '', seuilMin: 0, prixUnitaire: undefined,
      piecePeinte: false, codePieceNonPeinte: '', emplacement: '', emplacement2: '',
    });
    setSlidePiece({ ouvert: true, piece: null });
  }, []);

  const ouvrirModifierPiece = useCallback((piece: Piece) => {
    setFormPiece({
      code: piece.code, nom: piece.nom, description: piece.description || '',
      couleur: piece.couleur || '', categoriePieceId: piece.categoriePieceId || '',
      uniteId: piece.uniteId || '', fournisseurId: piece.fournisseurId || '',
      seuilMin: piece.seuilMin, prixUnitaire: piece.prixUnitaire ?? undefined,
      piecePeinte: piece.piecePeinte, codePieceNonPeinte: piece.codePieceNonPeinte || '',
      emplacement: piece.emplacement || '', emplacement2: piece.emplacement2 || '',
    });
    setSlidePiece({ ouvert: true, piece });
  }, []);

  const sauvegarderPiece = useCallback(async () => {
    try {
      if (slidePiece.piece) {
        await modifierPiece(slidePiece.piece.id, formPiece);
        toast('Pièce modifiée avec succès');
      } else {
        await creerPiece({ ...formPiece, quantite: 0, inventaireEmplacement1: 0, inventaireEmplacement2: 0, partiPeinture: 0, achatFait: false, actif: true });
        toast('Pièce ajoutée avec succès');
      }
      setSlidePiece({ ouvert: false, piece: null });
      chargerPieces();
    } catch (e: any) {
      toast(e.message || 'Erreur lors de la sauvegarde', 'error');
    }
  }, [formPiece, slidePiece.piece, modifierPiece, creerPiece, chargerPieces, toast]);

  const ouvrirAjouterFournisseur = useCallback(() => {
    setFormFournisseur({
      nom: '', contact: '', telephone: '', email: '', adresse: '', notes: '',
      typeAchat: '', formulaireFile: null, supprimerFormulaire: false,
      formulaireNom: '', formulaireMime: '',
    });
    setSlideFournisseur({ ouvert: true, fournisseur: null });
  }, []);

  const ouvrirModifierFournisseur = useCallback((f: FournisseurInv) => {
    setFormFournisseur({
      nom: f.nom, contact: f.contact || '', telephone: f.telephone || '',
      email: f.email || '', adresse: f.adresse || '', notes: f.notes || '',
      typeAchat: f.typeAchat || '', formulaireFile: null, supprimerFormulaire: false,
      formulaireNom: f.formulaireNom || '', formulaireMime: f.formulaireMime || '',
    });
    setSlideFournisseur({ ouvert: true, fournisseur: f });
  }, []);

  const sauvegarderFournisseur = useCallback(async () => {
    try {
      if (slideFournisseur.fournisseur) {
        await modifierFournisseur(slideFournisseur.fournisseur.id, {
          nom: formFournisseur.nom,
          contact: formFournisseur.contact,
          telephone: formFournisseur.telephone,
          email: formFournisseur.email,
          adresse: formFournisseur.adresse,
          notes: formFournisseur.notes,
          typeAchat: formFournisseur.typeAchat,
          formulaire: formFournisseur.formulaireFile,
          supprimerFormulaire: formFournisseur.supprimerFormulaire,
        });
        toast('Fournisseur modifié avec succès');
      } else {
        await creerFournisseur({
          nom: formFournisseur.nom,
          contact: formFournisseur.contact,
          telephone: formFournisseur.telephone,
          email: formFournisseur.email,
          adresse: formFournisseur.adresse,
          notes: formFournisseur.notes,
          typeAchat: formFournisseur.typeAchat,
          formulaire: formFournisseur.formulaireFile,
        });
        toast('Fournisseur ajouté avec succès');
      }
      setSlideFournisseur({ ouvert: false, fournisseur: null });
      chargerFournisseurs();
    } catch (e: any) {
      toast(e.message || 'Erreur lors de la sauvegarde', 'error');
    }
  }, [formFournisseur, slideFournisseur.fournisseur, modifierFournisseur, creerFournisseur, chargerFournisseurs, toast]);

  const confirmerSuppression = useCallback((type: string, id: string, nom: string) => {
    setConfirm({
      ouvert: true,
      titre: `Supprimer ${type}`,
      message: `Êtes-vous sûr de vouloir supprimer "${nom}" ?`,
      onConfirm: async () => {
        try {
          if (type === 'la pièce') {
            await supprimerPiece(id);
            chargerPieces();
          } else if (type === 'le fournisseur') {
            await supprimerFournisseur(id);
            chargerFournisseurs();
          } else if (type === "l'unité") {
            await supprimerUnite(id);
            chargerUnites();
          }
          toast(`${nom} supprimé(e) avec succès`);
        } catch (e: any) {
          toast(e.message || 'Erreur lors de la suppression', 'error');
        }
        setConfirm({ ouvert: false, titre: '', message: '', onConfirm: () => {} });
      },
    });
  }, [supprimerPiece, supprimerFournisseur, supprimerUnite, chargerPieces, chargerFournisseurs, chargerUnites, toast]);

  const enregistrerTransaction = useCallback(async () => {
    if (!pieceSelectionnee || transaction.quantite <= 0) {
      toast('Veuillez sélectionner une pièce et entrer une quantité valide', 'error');
      return;
    }

    // Gestion spéciale pour Sortie-Peinture
    if (transaction.type === 'SORTIE_PEINTURE') {
      if (!piecePeinteSelectionnee) {
        toast('Veuillez sélectionner la pièce de couleur', 'error');
        return;
      }

      // Créer la transaction pour la pièce non peinte (sortie vers peinture)
      try {
        await creerTransaction({
          produitId: pieceSelectionnee.id,
          type: 'SORTIE_PEINTURE',
          quantite: transaction.quantite,
          notes: `Envoi à la peinture pour ${piecePeinteSelectionnee.code}`,
          emplacement: 'Magasin',
        });
        toast(`Sortie-Peinture enregistrée pour ${pieceSelectionnee.code}`);

        // Ajouter une commande de réception pour la pièce peinte
        const newCommande: CommandePeinture = {
          id: Date.now(),
          produitPeintId: piecePeinteSelectionnee.id,
          code: piecePeinteSelectionnee.code,
          description: piecePeinteSelectionnee.nom,
          quantite: transaction.quantite,
          dateDepart: new Date(),
          ordre: Date.now(),
        };
        setCommandesPeinture(prev => [...prev, newCommande]);

        // Réinitialiser la sélection de la pièce peinte
        setPiecePeinteSelectionnee(null);
      } catch (e: any) {
        toast(e.message || 'Erreur lors de la transaction', 'error');
        return;
      }
    } else {
      // Transaction normale (Entrée, Sortie, Ajustement)
      try {
        await creerTransaction({
          produitId: pieceSelectionnee.id,
          type: transaction.type,
          quantite: transaction.quantite,
          notes: '',
          emplacement: 'Magasin',
        });
        toast(`${getTypeLabel(transaction.type)} enregistrée avec succès`);
      } catch (e: any) {
        toast(e.message || 'Erreur lors de la transaction', 'error');
        return;
      }
    }

    // Recharger les données
    chargerPieces();
    chargerTransactions();

    // Ne pas réinitialiser la pièce sélectionnée pour pouvoir vérifier l'effet
    setTransaction({ type: 'ENTREE', quantite: 0 });
  }, [pieceSelectionnee, transaction, piecePeinteSelectionnee, creerTransaction, chargerPieces, chargerTransactions, toast, getTypeLabel]);

  const recevoirCommandePeinture = useCallback(async (commande: CommandePeinture) => {
    try {
      // Créer une transaction d'entrée pour la pièce peinte
      await creerTransaction({
        produitId: commande.produitPeintId,
        type: 'ENTREE',
        quantite: commande.quantite,
        notes: `Réception de peinture - commande du ${commande.dateDepart.toLocaleDateString()}`,
        emplacement: 'Magasin',
      });
      toast(`Réception de ${commande.code} (${commande.quantite}) enregistrée`);

      // Retirer la commande de la liste
      setCommandesPeinture(prev => prev.filter(c => c.id !== commande.id));

      // Recharger les données
      chargerPieces();
      chargerTransactions();
    } catch (e: any) {
      toast(e.message || 'Erreur lors de la réception', 'error');
    }
  }, [creerTransaction, chargerPieces, chargerTransactions, toast]);

  const ajouterUniteInline = useCallback(async () => {
    if (!nouvelleUnite.unite) {
      toast("Veuillez entrer le nom de l'unité", 'error');
      return;
    }
    try {
      await creerUnite(nouvelleUnite);
      toast('Unité ajoutée avec succès');
      setNouvelleUnite({ unite: '', qtePar: 1, description: '' });
      chargerUnites();
    } catch (e: any) {
      toast(e.message || "Erreur lors de l'ajout", 'error');
    }
  }, [nouvelleUnite, creerUnite, chargerUnites, toast]);

  const toggleAchatFait = useCallback(async (piece: Piece) => {
    try {
      await modifierPiece(piece.id, { achatFait: !piece.achatFait });
      chargerPieces();
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error');
    }
  }, [modifierPiece, chargerPieces, toast]);

  // ╔══════════════════════════════════════════════════════╗
  // ║         VUE LISTE DES PIÈCES EN INVENTAIRE          ║
  // ╚══════════════════════════════════════════════════════╝

  const VueListeInventaire = useMemo(() => (
    <div className="space-y-[1rem]">
      <h2 className="text-[1.5rem] font-bold text-center text-slate-800 underline">Liste des pièces en inventaire</h2>

      {/* Filtres */}
      <div className="bg-white rounded-xl p-[1rem] border border-slate-200 flex flex-wrap items-end gap-[1rem]">
        <div className="flex-1 min-w-[12.5rem]">
          <label className="block text-[0.875rem] text-slate-600 mb-[0.25rem]">Recherche par code ou description</label>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.875rem]"
            placeholder="Rechercher..."
          />
        </div>

        <div className="flex items-center gap-[0.5rem]">
          <input
            type="checkbox"
            checked={filtrePointCommande}
            onChange={(e) => setFiltrePointCommande(e.target.checked)}
            className="w-[1.25rem] h-[1.25rem]"
          />
          <label className="text-[0.875rem] text-slate-600">Point commande atteint</label>
        </div>

        <div>
          <label className="block text-[0.875rem] text-slate-600 mb-[0.25rem]">Catégorie</label>
          <select
            value={filtreCategorie}
            onChange={(e) => setFiltreCategorie(e.target.value)}
            className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg min-w-[9.375rem] text-[0.875rem]"
          >
            <option value="">Catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[0.875rem] text-slate-600 mb-[0.25rem]">Fournisseur</label>
          <select
            value={filtreFournisseur}
            onChange={(e) => setFiltreFournisseur(e.target.value)}
            className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg min-w-[9.375rem] text-[0.875rem]"
          >
            <option value="">Fournisseurs</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.8125rem]">
            <thead className="bg-sky-100">
              <tr>
                <th className="px-[1rem] py-[0.75rem] text-left font-semibold text-slate-700 underline">Code</th>
                <th className="px-[1rem] py-[0.75rem] text-left font-semibold text-slate-700 underline">Description</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline hidden lg:table-cell">Couleur</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline">Catégorie</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline hidden xl:table-cell">Fournisseur</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline hidden lg:table-cell">Unité inventaire</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline">Inv. total</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline hidden md:table-cell">Parti peinture</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline">Point commande</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700">Achat fait</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingPieces ? (
                <tr><td colSpan={10} className="px-[1rem] py-[3rem] text-center text-slate-500">Chargement...</td></tr>
              ) : piecesFiltrees.length === 0 ? (
                <tr><td colSpan={10} className="px-[1rem] py-[3rem] text-center text-slate-500">Aucune pièce trouvée</td></tr>
              ) : piecesFiltrees.map((piece, index) => (
                <tr
                  key={piece.id}
                  className={`hover:bg-slate-50 cursor-pointer ${index % 2 === 0 ? 'bg-sky-50' : 'bg-white'}`}
                  onClick={() => ouvrirModifierPiece(piece)}
                >
                  <td className="px-[1rem] py-[0.75rem] font-medium text-slate-800">{piece.code}</td>
                  <td className="px-[1rem] py-[0.75rem] text-slate-600">{piece.nom}</td>
                  <td className="px-[1rem] py-[0.75rem] text-center text-slate-600 hidden lg:table-cell">{piece.couleur || '-'}</td>
                  <td className="px-[1rem] py-[0.75rem] text-center text-slate-600">{piece.categoriePiece?.nom || '-'}</td>
                  <td className="px-[1rem] py-[0.75rem] text-center text-slate-600 text-[0.75rem] hidden xl:table-cell">{piece.fournisseur?.nom || '-'}</td>
                  <td className="px-[1rem] py-[0.75rem] text-center text-slate-600 hidden lg:table-cell">{piece.unite?.description || piece.unite?.unite || '-'}</td>
                  <td className={`px-[1rem] py-[0.75rem] text-center font-bold ${getCouleurStock(piece.quantite, piece.seuilMin)}`}>
                    {piece.quantite}
                  </td>
                  <td className="px-[1rem] py-[0.75rem] text-center text-slate-600 hidden md:table-cell">{piece.partiPeinture || ''}</td>
                  <td className={`px-[1rem] py-[0.75rem] text-center ${getCouleurPointCommande(piece.quantite, piece.seuilMin)} ${getCouleurStock(piece.quantite, piece.seuilMin)}`}>
                    {piece.seuilMin > 0 ? piece.seuilMin : ''}
                  </td>
                  <td className="px-[1rem] py-[0.75rem] text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={piece.achatFait}
                      onChange={() => toggleAchatFait(piece)}
                      className="w-[1rem] h-[1rem]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ), [
    loadingPieces, piecesFiltrees, categories, fournisseurs, recherche, filtreCategorie,
    filtreFournisseur, filtrePointCommande, getCouleurStock, getCouleurPointCommande,
    ouvrirModifierPiece, toggleAchatFait
  ]);

  // ╔══════════════════════════════════════════════════════╗
  // ║              VUE ENTRÉES / SORTIES                   ║
  // ╚══════════════════════════════════════════════════════╝

  const VueEntreesSorties = useMemo(() => (
    <div className="space-y-[1.5rem]">
      <h2 className="text-[1.5rem] font-bold text-center text-slate-800 underline">Entrée / Sortie d&apos;inventaire</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.5rem]">
        {/* Recherche pièce */}
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.5rem]">Recherche de pièce par code ou description</label>
          <input
            type="text"
            value={recherchePiece}
            onChange={(e) => setRecherchePiece(e.target.value)}
            className="w-full px-[1rem] py-[0.75rem] border border-slate-300 rounded-lg text-[0.875rem]"
            placeholder="Rechercher une pièce..."
          />
        </div>

        {/* Inventaire actuel */}
        {pieceSelectionnee && (
          <div className="bg-white rounded-xl border border-slate-200 p-[1rem]">
            <h3 className="text-[0.875rem] font-semibold text-slate-700 mb-[0.5rem] underline">Inventaire actuel de la pièce</h3>
            <div className="grid grid-cols-2 gap-[0.5rem] text-center">
              <div className="bg-slate-100 p-[0.5rem] rounded">
                <p className="text-[0.75rem] text-slate-500">Total</p>
                <p className="text-[1.25rem] font-bold">{pieceSelectionnee.quantite}</p>
              </div>
              <div className="bg-slate-100 p-[0.5rem] rounded">
                <p className="text-[0.75rem] text-slate-500">Magasin</p>
                <p className="text-[1.25rem] font-bold">{pieceSelectionnee.inventaireEmplacement1}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Formulaire de transaction */}
      <div className="bg-green-100 rounded-xl p-[1.5rem] border border-green-300">
        <h3 className="text-[1.25rem] font-bold text-center text-slate-800 mb-[1.5rem]">Ajouter une transaction</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-[1rem] items-end">
          <div>
            <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.5rem]">Code de la pièce</label>
            <select
              value={pieceSelectionnee?.id || ''}
              onChange={(e) => {
                const p = pieces.find((p) => p.id === e.target.value);
                setPieceSelectionnee(p || null);
                // Réinitialiser la sélection de pièce peinte si la pièce change
                setPiecePeinteSelectionnee(null);
              }}
              className="w-full px-[1rem] py-[0.75rem] border border-slate-300 rounded-lg bg-white text-[0.875rem]"
            >
              <option value="">Sélectionner...</option>
              {piecesNonPeintes.map((piece) => (
                <option key={piece.id} value={piece.id}>{piece.code}</option>
              ))}
            </select>
            {pieceSelectionnee && (
              <div className="mt-[0.5rem] p-[0.5rem] bg-white rounded border text-[0.875rem]">
                <p className="font-medium">{pieceSelectionnee.nom}</p>
                <p className="text-slate-500">{pieceSelectionnee.unite?.description || pieceSelectionnee.unite?.unite || ''}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.5rem]">Transaction</label>
            <select
              value={transaction.type}
              onChange={(e) => setTransaction({ ...transaction, type: e.target.value as TypeTransaction })}
              className="w-full px-[1rem] py-[0.75rem] border border-slate-300 rounded-lg bg-white text-[0.875rem]"
            >
              <option value="ENTREE">Entrée</option>
              <option value="SORTIE">Sortie</option>
              <option value="SORTIE_PEINTURE">Sortie-Peinture</option>
              <option value="AJUSTEMENT">Mise à jour</option>
            </select>
          </div>

          <div>
            <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.5rem]">Qté Magasin</label>
            <input
              type="number"
              value={transaction.quantite}
              onChange={(e) => setTransaction({ ...transaction, quantite: parseInt(e.target.value) || 0 })}
              className="w-full px-[1rem] py-[0.75rem] border border-slate-300 rounded-lg text-[0.875rem]"
              min="0"
            />
          </div>

          <button
            onClick={enregistrerTransaction}
            className="px-[1.5rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
          >
            Enregistrer {getTypeLabel(transaction.type)}
          </button>
        </div>

        {/* Champ supplémentaire pour Sortie-Peinture : choix de la pièce peinte */}
        {transaction.type === 'SORTIE_PEINTURE' && pieceSelectionnee && (
          <div className="mt-4">
            <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.5rem]">Pièce de couleur (pièce peinte à réceptionner)</label>
            <select
              value={piecePeinteSelectionnee?.id || ''}
              onChange={(e) => {
                const p = piecesPeintesAssociees.find(p => p.id === e.target.value);
                setPiecePeinteSelectionnee(p || null);
              }}
              className="w-full px-[1rem] py-[0.75rem] border border-slate-300 rounded-lg bg-white text-[0.875rem]"
            >
              <option value="">Sélectionner...</option>
              {piecesPeintesAssociees.map((p) => (
                <option key={p.id} value={p.id}>{p.code} - {p.nom}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Section réception commande (dynamique) */}
      <div className="bg-red-100 rounded-xl p-[1.5rem] border border-red-300">
        <h3 className="text-[1.25rem] font-bold text-center text-slate-800 mb-[1rem] underline">Réceptionner une commande</h3>
        {commandesPeinture.length === 0 ? (
          <p className="text-center text-slate-500 text-[0.8125rem]">Aucune commande en attente de réception</p>
        ) : (
          <table className="w-full text-[0.875rem]">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="px-[1rem] py-[0.5rem] text-left font-semibold underline">Code</th>
                <th className="px-[1rem] py-[0.5rem] text-left font-semibold underline">Description</th>
                <th className="px-[1rem] py-[0.5rem] text-center font-semibold underline">Qté</th>
                <th className="px-[1rem] py-[0.5rem] text-center font-semibold underline"># Ordre</th>
                <th className="px-[1rem] py-[0.5rem] text-center font-semibold underline">Date de départ</th>
                <th className="px-[1rem] py-[0.5rem] text-center font-semibold underline">Action</th>
              </tr>
            </thead>
            <tbody>
              {commandesPeinture.map((cmd) => (
                <tr key={cmd.id} className="border-b border-slate-200">
                  <td className="px-[1rem] py-[0.5rem]">{cmd.code}</td>
                  <td className="px-[1rem] py-[0.5rem]">{cmd.description}</td>
                  <td className="px-[1rem] py-[0.5rem] text-center">{cmd.quantite}</td>
                  <td className="px-[1rem] py-[0.5rem] text-center">{cmd.ordre}</td>
                  <td className="px-[1rem] py-[0.5rem] text-center">{cmd.dateDepart.toLocaleDateString('fr-CA')}</td>
                  <td className="px-[1rem] py-[0.5rem] text-center">
                    <button
                      onClick={() => recevoirCommandePeinture(cmd)}
                      className="text-blue-600 hover:underline text-[0.8125rem]"
                    >
                      Réceptionner
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  ), [
    recherchePiece, piecesNonPeintes, pieceSelectionnee, transaction, piecePeinteSelectionnee,
    piecesPeintesAssociees, commandesPeinture, enregistrerTransaction, getTypeLabel, recevoirCommandePeinture
  ]);

  // ╔══════════════════════════════════════════════════════╗
  // ║                VUE TRANSACTIONS                      ║
  // ╚══════════════════════════════════════════════════════╝

  const VueTransactions = useMemo(() => (
    <div className="space-y-[1rem]">
      <h2 className="text-[1.5rem] font-bold text-center text-slate-800 underline">Transaction d&apos;inventaire</h2>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-[1rem] justify-center">
        <div className="flex items-center gap-[0.5rem]">
          <label className="text-[0.875rem] text-slate-600">Recherche de pièce:</label>
          <input
            type="text"
            value={rechercheTransaction}
            onChange={(e) => setRechercheTransaction(e.target.value)}
            className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg w-[12rem] text-[0.875rem]"
            placeholder="Code ou description"
          />
        </div>

        <div className="flex items-center gap-[0.5rem]">
          <label className="text-[0.875rem] text-slate-600">Date de transaction:</label>
          <input
            type="date"
            value={dateTransaction}
            onChange={(e) => setDateTransaction(e.target.value)}
            className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.875rem]"
          />
          <button
            onClick={() => setDateTransaction('')}
            className="px-[1rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[0.875rem] transition-colors"
          >
            Enlever la date
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[0.8125rem]">
          <thead className="bg-slate-100">
            <tr className="border-b-2 border-blue-400">
              <th className="px-[1rem] py-[0.75rem] text-left font-semibold text-slate-700 underline">Code</th>
              <th className="px-[1rem] py-[0.75rem] text-left font-semibold text-slate-700 underline">Description</th>
              <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline">Qté</th>
              <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline">Type</th>
              <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline hidden md:table-cell">Pièce peinte</th>
              <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline">Date transaction</th>
              <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 underline hidden lg:table-cell">Réception peinture</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactionsFiltrees.length === 0 ? (
              <tr><td colSpan={7} className="px-[1rem] py-[3rem] text-center text-slate-500">Aucune transaction trouvée</td></tr>
            ) : transactionsFiltrees.map((trans, index) => (
              <tr key={trans.id} className={index % 2 === 0 ? 'bg-sky-50' : 'bg-white'}>
                <td className="px-[1rem] py-[0.75rem] font-medium">{trans.produit?.code || '-'}</td>
                <td className="px-[1rem] py-[0.75rem] text-slate-600">{trans.produit?.nom || '-'}</td>
                <td className="px-[1rem] py-[0.75rem] text-center font-bold">{trans.quantite}</td>
                <td className="px-[1rem] py-[0.75rem] text-center">{getTypeLabel(trans.type)}</td>
                <td className="px-[1rem] py-[0.75rem] text-center hidden md:table-cell">{trans.codePiecePeinte ? 'Oui' : ''}</td>
                <td className="px-[1rem] py-[0.75rem] text-center">{formaterDate(trans.createdAt)}</td>
                <td className="px-[1rem] py-[0.75rem] text-center hidden lg:table-cell">
                  {trans.type === 'SORTIE_PEINTURE' && !trans.dateReceptionPeinture && (
                    <button className="text-blue-600 hover:underline text-[0.8125rem]">Réceptionner</button>
                  )}
                  {trans.dateReceptionPeinture && formaterDate(trans.dateReceptionPeinture)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ), [transactionsFiltrees, getTypeLabel, formaterDate]);

  // ╔══════════════════════════════════════════════════════╗
  // ║               MODAL PIÈCES (DÉTAILLÉE)               ║
  // ╚══════════════════════════════════════════════════════╝

  const PiecesModal = useMemo(() => {
    if (!showPiecesModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-slate-400 rounded-2xl shadow-2xl w-full max-w-[75rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1.5rem]">
            <h2 className="text-[1.875rem] font-bold text-center text-slate-800 underline mb-[1rem]">Pièces</h2>
            <div className="flex items-center gap-[1rem] mb-[1rem]">
              <label className="text-slate-700 text-[0.875rem]">Recherche par code:</label>
              <input
                type="text"
                value={recherchePiecesModal}
                onChange={(e) => setRecherchePiecesModal(e.target.value)}
                className="px-[1rem] py-[0.5rem] border rounded-lg flex-1 max-w-[25rem] text-[0.875rem]"
                placeholder="Rechercher..."
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-[1.5rem]">
            <table className="w-full text-[0.8125rem] bg-white rounded-lg overflow-hidden">
              <thead className="bg-sky-100 sticky top-0">
                <tr>
                  <th className="px-[0.75rem] py-[0.5rem] text-left text-[0.75rem] font-semibold underline">Code<br/>À peinturer<br/>Pièce à peinturer</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-left text-[0.75rem] font-semibold underline">Description<br/>Couleur<br/>Catégorie</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center text-[0.75rem] font-semibold underline">Fournisseur<br/>Unité inventaire<br/>Prix</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center text-[0.75rem] font-semibold">Lieu #1<br/>Stock #1</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center text-[0.75rem] font-semibold">Lieu #2<br/>Stock #2</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center text-[0.75rem] font-semibold underline">Inventaire total<br/>Transit peinture<br/>Point de commande</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center text-[0.75rem] font-semibold">Date dernière<br/>transaction</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center text-[0.75rem] font-semibold w-[3rem]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {piecesModalFiltrees.map((piece) => (
                  <tr key={piece.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setShowPiecesModal(false); ouvrirModifierPiece(piece); }}>
                    <td className="px-[0.75rem] py-[0.5rem]">
                      <p className="font-medium">{piece.code}</p>
                      {piece.piecePeinte && (
                        <>
                          <div className="flex items-center gap-[0.25rem] text-[0.75rem]">
                            <input type="checkbox" checked readOnly className="w-[0.75rem] h-[0.75rem]" />
                            <span>À peinturer</span>
                          </div>
                          <p className="text-[0.75rem] text-slate-500">{piece.codePieceNonPeinte || '-'}</p>
                        </>
                      )}
                    </td>
                    <td className="px-[0.75rem] py-[0.5rem]">
                      <p>{piece.nom}</p>
                      <p className="text-[0.75rem] text-slate-500">{piece.couleur || ''}</p>
                      <p className="text-[0.75rem] text-slate-500">{piece.categoriePiece?.nom || ''}</p>
                    </td>
                    <td className="px-[0.75rem] py-[0.5rem] text-center text-[0.75rem]">
                      <p>{piece.fournisseur?.nom || '-'}</p>
                      <p>{piece.unite?.description || piece.unite?.unite || '-'}</p>
                      <p>{piece.prixUnitaire ? `${piece.prixUnitaire} $` : ''}</p>
                    </td>
                    <td className="px-[0.75rem] py-[0.5rem] text-center bg-sky-100">
                      <p className="text-[0.75rem] text-slate-500">{piece.emplacement || 'Magasin'}</p>
                      <p className="font-bold">{piece.inventaireEmplacement1}</p>
                    </td>
                    <td className="px-[0.75rem] py-[0.5rem] text-center">
                      <p className="text-[0.75rem] text-slate-500">{piece.emplacement2 || ''}</p>
                      <p className="font-bold">{piece.inventaireEmplacement2 || ''}</p>
                    </td>
                    <td className={`px-[0.75rem] py-[0.5rem] text-center font-bold ${getCouleurStock(piece.quantite, piece.seuilMin)}`}>
                      {piece.quantite}
                      <p className="text-[0.75rem] font-normal">{piece.partiPeinture || ''}</p>
                      <p className="text-[0.75rem] font-normal">{piece.seuilMin > 0 ? piece.seuilMin : ''}</p>
                    </td>
                    <td className="px-[0.75rem] py-[0.5rem] text-center text-[0.75rem]">
                      {piece.dateDerniereTransaction ? formaterDate(piece.dateDerniereTransaction) : ''}
                    </td>
                    <td className="px-[0.75rem] py-[0.5rem]" onClick={(e) => e.stopPropagation()}>
                      <KebabMenu actions={[
                        { label: 'Modifier', icone: '✏️', onClick: () => { setShowPiecesModal(false); ouvrirModifierPiece(piece); } },
                        { label: 'Supprimer', icone: '🗑️', danger: true, onClick: () => confirmerSuppression('la pièce', piece.id, piece.code) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-[1rem] flex justify-center gap-[1rem]">
            <button
              onClick={() => setShowPiecesModal(false)}
              className="px-[2rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
            >
              Quitter
            </button>
            <button
              onClick={() => { setShowPiecesModal(false); ouvrirAjouterPiece(); }}
              className="px-[2rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
            >
              Ajouter une pièce
            </button>
          </div>
        </div>
      </div>
    );
  }, [showPiecesModal, piecesModalFiltrees, ouvrirModifierPiece, ouvrirAjouterPiece, confirmerSuppression, getCouleurStock, formaterDate]);

  // ╔══════════════════════════════════════════════════════╗
  // ║              MODAL FOURNISSEURS                      ║
  // ╚══════════════════════════════════════════════════════╝

  const FournisseursModal = useMemo(() => {
    if (!showFournisseursModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-slate-400 rounded-2xl shadow-2xl w-full max-w-[75rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1.5rem]">
            <h2 className="text-[1.875rem] font-bold text-center text-slate-800 underline mb-[1rem]">Fournisseurs</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-[1.5rem]">
            <table className="w-full text-[0.8125rem] bg-white rounded-lg overflow-hidden">
              <thead className="bg-sky-100 sticky top-0">
                <tr>
                  <th className="px-[0.75rem] py-[0.5rem] text-left font-semibold underline">Fournisseur</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold underline">Adresse</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold underline">Contact</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold underline">Téléphone</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold underline">Email</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold underline">Type d'achat</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold underline">Formulaire</th>
                  <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold w-[3rem]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fournisseurs.map((f, index) => (
                  <tr
                    key={f.id}
                    className={`hover:bg-slate-50 cursor-pointer ${index % 2 === 0 ? 'bg-sky-50' : 'bg-white'}`}
                    onClick={() => { setShowFournisseursModal(false); ouvrirModifierFournisseur(f); }}
                  >
                    <td className="px-[0.75rem] py-[0.5rem] font-bold">{f.nom}</td>
                    <td className="px-[0.75rem] py-[0.5rem] text-center text-[0.75rem]">{f.adresse || '-'}</td>
                    <td className="px-[0.75rem] py-[0.5rem] text-center">{f.contact || '-'}</td>
                    <td className="px-[0.75rem] py-[0.5rem] text-center">{f.telephone || '-'}</td>
                    <td className="px-[0.75rem] py-[0.5rem] text-center text-[0.75rem]">{f.email || '-'}</td>
                    <td className="px-[0.75rem] py-[0.5rem] text-center">{f.typeAchat || '-'}</td>
                    <td className="px-[0.75rem] py-[0.5rem] text-center">
                      {f.formulaireNom ? (
                        <a
                          href={`/api/inventaire/fournisseurs/${f.id}/formulaire`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm"
                        >
                          📎 {f.formulaireNom.length > 20 ? f.formulaireNom.substring(0, 20) + '…' : f.formulaireNom}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-[0.75rem] py-[0.5rem]" onClick={(e) => e.stopPropagation()}>
                      <KebabMenu actions={[
                        { label: 'Modifier', icone: '✏️', onClick: () => { setShowFournisseursModal(false); ouvrirModifierFournisseur(f); } },
                        { label: 'Supprimer', icone: '🗑️', danger: true, onClick: () => confirmerSuppression('le fournisseur', f.id, f.nom) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-[1rem] flex justify-center gap-[1rem]">
            <button
              onClick={() => { setShowFournisseursModal(false); ouvrirAjouterFournisseur(); }}
              className="px-[2rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
            >
              Ajouter un fournisseur
            </button>
            <button
              onClick={() => setShowFournisseursModal(false)}
              className="px-[2rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
            >
              Quitter
            </button>
          </div>
        </div>
      </div>
    );
  }, [showFournisseursModal, fournisseurs, ouvrirModifierFournisseur, ouvrirAjouterFournisseur, confirmerSuppression]);

  // ╔══════════════════════════════════════════════════════╗
  // ║                 MODAL UNITÉS                         ║
  // ╚══════════════════════════════════════════════════════╝

  const UnitesModal = useMemo(() => {
    if (!showUnitesModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-slate-400 rounded-2xl shadow-2xl w-full max-w-[48rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1.5rem]">
            <h2 className="text-[1.875rem] font-bold text-center text-slate-800 underline mb-[1rem]">Unités</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-[1.5rem]">
            <table className="w-full text-[0.8125rem] bg-white rounded-lg overflow-hidden mb-[1.5rem]">
              <thead className="bg-sky-100 sticky top-0">
                <tr>
                  <th className="px-[1rem] py-[0.5rem] text-left font-semibold underline">Unité</th>
                  <th className="px-[1rem] py-[0.5rem] text-center font-semibold underline">Qté par unité</th>
                  <th className="px-[1rem] py-[0.5rem] text-center font-semibold underline">Description</th>
                  <th className="px-[1rem] py-[0.5rem] text-center font-semibold w-[3rem]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {unites.map((unite) => (
                  <tr key={unite.id} className="hover:bg-slate-50">
                    <td className="px-[1rem] py-[0.5rem]">{unite.unite}</td>
                    <td className="px-[1rem] py-[0.5rem] text-center">{unite.qtePar}</td>
                    <td className="px-[1rem] py-[0.5rem] text-center">{unite.description || '-'}</td>
                    <td className="px-[1rem] py-[0.5rem]">
                      <KebabMenu actions={[
                        { label: 'Supprimer', icone: '🗑️', danger: true, onClick: () => confirmerSuppression("l'unité", unite.id, unite.unite) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Ajouter une unité (inline) */}
            <div className="bg-white rounded-lg p-[1rem] mb-[1rem]">
              <h3 className="text-[1.25rem] font-bold text-center text-slate-800 underline mb-[1rem]">Ajouter une unité d&apos;inventaire</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-[1rem] items-end">
                <div>
                  <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem] underline">Unité</label>
                  <input
                    type="text"
                    value={nouvelleUnite.unite}
                    onChange={(e) => setNouvelleUnite({ ...nouvelleUnite, unite: e.target.value })}
                    className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
                  />
                </div>
                <div>
                  <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem] underline">Quantité par unité</label>
                  <input
                    type="number"
                    value={nouvelleUnite.qtePar}
                    onChange={(e) => setNouvelleUnite({ ...nouvelleUnite, qtePar: parseInt(e.target.value) || 1 })}
                    className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
                  />
                </div>
                <div>
                  <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem] underline">Description</label>
                  <input
                    type="text"
                    value={nouvelleUnite.description}
                    onChange={(e) => setNouvelleUnite({ ...nouvelleUnite, description: e.target.value })}
                    className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
                  />
                </div>
                <button
                  onClick={ajouterUniteInline}
                  className="px-[1.5rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          <div className="p-[1rem] flex justify-center">
            <button
              onClick={() => setShowUnitesModal(false)}
              className="px-[2rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
            >
              Sortir
            </button>
          </div>
        </div>
      </div>
    );
  }, [showUnitesModal, unites, nouvelleUnite, ajouterUniteInline, confirmerSuppression]);

  // ╔══════════════════════════════════════════════════════╗
  // ║            SLIDE PANEL - PIÈCE                       ║
  // ╚══════════════════════════════════════════════════════╝

  const SlidePieceForm = useMemo(() => (
    <SlidePanel
      ouvert={slidePiece.ouvert}
      onFermer={() => setSlidePiece({ ouvert: false, piece: null })}
      titre={slidePiece.piece ? `Modifier : ${slidePiece.piece.code}` : 'Ajouter une pièce'}
    >
      <div className="grid grid-cols-2 gap-[1rem]">
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Code *</label>
          <input
            type="text"
            value={formPiece.code}
            onChange={(e) => setFormPiece({ ...formPiece, code: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Description *</label>
          <input
            type="text"
            value={formPiece.nom}
            onChange={(e) => setFormPiece({ ...formPiece, nom: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Couleur</label>
          <input
            type="text"
            value={formPiece.couleur}
            onChange={(e) => setFormPiece({ ...formPiece, couleur: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Catégorie</label>
          <select
            value={formPiece.categoriePieceId}
            onChange={(e) => setFormPiece({ ...formPiece, categoriePieceId: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          >
            <option value="">Sélectionner...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Fournisseur</label>
          <select
            value={formPiece.fournisseurId}
            onChange={(e) => setFormPiece({ ...formPiece, fournisseurId: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          >
            <option value="">Sélectionner...</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Unité inventaire</label>
          <select
            value={formPiece.uniteId}
            onChange={(e) => setFormPiece({ ...formPiece, uniteId: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          >
            <option value="">Sélectionner...</option>
            {unites.map((u) => (
              <option key={u.id} value={u.id}>{u.description || u.unite}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Point de commande</label>
          <input
            type="number"
            value={formPiece.seuilMin}
            onChange={(e) => setFormPiece({ ...formPiece, seuilMin: parseInt(e.target.value) || 0 })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Prix unitaire</label>
          <input
            type="number"
            step="0.01"
            value={formPiece.prixUnitaire ?? ''}
            onChange={(e) => setFormPiece({ ...formPiece, prixUnitaire: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Emplacement #1</label>
          <input
            type="text"
            value={formPiece.emplacement}
            onChange={(e) => setFormPiece({ ...formPiece, emplacement: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Emplacement #2</label>
          <input
            type="text"
            value={formPiece.emplacement2}
            onChange={(e) => setFormPiece({ ...formPiece, emplacement2: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Code pièce non peinte</label>
          <input
            type="text"
            value={formPiece.codePieceNonPeinte}
            onChange={(e) => setFormPiece({ ...formPiece, codePieceNonPeinte: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div className="flex items-center gap-[0.5rem] pt-[1.5rem]">
          <input
            type="checkbox"
            checked={formPiece.piecePeinte}
            onChange={(e) => setFormPiece({ ...formPiece, piecePeinte: e.target.checked })}
            className="w-[1.25rem] h-[1.25rem]"
          />
          <label className="text-[0.875rem] text-slate-700">À peinturer</label>
        </div>
      </div>

      <div className="flex justify-center gap-[1rem] mt-[1.5rem] pt-[1.5rem] border-t border-slate-200">
        <button
          onClick={() => setSlidePiece({ ouvert: false, piece: null })}
          className="px-[1.5rem] py-[0.5rem] border border-slate-300 rounded-lg hover:bg-slate-50 text-[0.875rem] transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={sauvegarderPiece}
          className="px-[1.5rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
        >
          {slidePiece.piece ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </SlidePanel>
  ), [slidePiece, formPiece, categories, fournisseurs, unites, sauvegarderPiece]);

  // ╔══════════════════════════════════════════════════════╗
  // ║          SLIDE PANEL - FOURNISSEUR                   ║
  // ╚══════════════════════════════════════════════════════╝

  const SlideFournisseurForm = useMemo(() => (
    <SlidePanel
      ouvert={slideFournisseur.ouvert}
      onFermer={() => setSlideFournisseur({ ouvert: false, fournisseur: null })}
      titre={slideFournisseur.fournisseur ? `Modifier : ${slideFournisseur.fournisseur.nom}` : 'Ajouter un fournisseur'}
    >
      <div className="grid grid-cols-2 gap-[1rem]">
        <div className="col-span-2">
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Nom du fournisseur *</label>
          <input
            type="text"
            value={formFournisseur.nom}
            onChange={(e) => setFormFournisseur({ ...formFournisseur, nom: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Adresse</label>
          <input
            type="text"
            value={formFournisseur.adresse}
            onChange={(e) => setFormFournisseur({ ...formFournisseur, adresse: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Contact</label>
          <input
            type="text"
            value={formFournisseur.contact}
            onChange={(e) => setFormFournisseur({ ...formFournisseur, contact: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div>
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Téléphone</label>
          <input
            type="tel"
            value={formFournisseur.telephone}
            onChange={(e) => setFormFournisseur({ ...formFournisseur, telephone: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Email</label>
          <input
            type="email"
            value={formFournisseur.email}
            onChange={(e) => setFormFournisseur({ ...formFournisseur, email: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Notes</label>
          <textarea
            value={formFournisseur.notes}
            onChange={(e) => setFormFournisseur({ ...formFournisseur, notes: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
            rows={3}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Type d'achat</label>
          <select
            value={formFournisseur.typeAchat}
            onChange={(e) => setFormFournisseur({ ...formFournisseur, typeAchat: e.target.value })}
            className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"
          >
            <option value="">-- Sélectionner --</option>
            {TYPE_ACHAT_LIST.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-[0.875rem] font-semibold text-slate-700 mb-[0.25rem]">Formulaire de commande (PDF, Word, Excel)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onChange={(e) => setFormFournisseur({ ...formFournisseur, formulaireFile: e.target.files?.[0] || null })}
            className="w-full text-[0.875rem]"
          />
          {formFournisseur.formulaireNom && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-slate-600">Fichier actuel :</span>
              <a
                href={`/api/inventaire/fournisseurs/${slideFournisseur.fournisseur?.id}/formulaire`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {formFournisseur.formulaireNom}
              </a>
              <button
                type="button"
                onClick={() => setFormFournisseur({ ...formFournisseur, supprimerFormulaire: true })}
                className="text-red-500 text-xs"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-[1rem] mt-[1.5rem] pt-[1.5rem] border-t border-slate-200">
        <button
          onClick={() => setSlideFournisseur({ ouvert: false, fournisseur: null })}
          className="px-[1.5rem] py-[0.5rem] border border-slate-300 rounded-lg hover:bg-slate-50 text-[0.875rem] transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={sauvegarderFournisseur}
          className="px-[1.5rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
        >
          {slideFournisseur.fournisseur ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </SlidePanel>
  ), [slideFournisseur, formFournisseur, sauvegarderFournisseur]);

  // ╔══════════════════════════════════════════════════════╗
  // ║              RENDU PRINCIPAL                         ║
  // ╚══════════════════════════════════════════════════════╝

  return (
    <div className="space-y-[1.5rem]">
      {/* Modals */}
      {PiecesModal}
      {FournisseursModal}
      {UnitesModal}

      {/* Slide Panels */}
      {SlidePieceForm}
      {SlideFournisseurForm}

      {/* Confirm Dialog */}
      <ConfirmDialog
        ouvert={confirm.ouvert}
        titre={confirm.titre}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ ouvert: false, titre: '', message: '', onConfirm: () => {} })}
        labelConfirm="Supprimer"
        danger
      />

      {/* Header avec navigation */}
      <div className="bg-slate-800 rounded-2xl p-[1rem] flex flex-wrap items-center justify-between gap-[0.75rem]">
        <div className="flex items-center gap-[1rem] flex-wrap">
          <div className="flex gap-[0.5rem]">
            <button
              onClick={() => setVueActive('liste')}
              className={`px-[1rem] py-[0.5rem] rounded-lg font-semibold text-[0.875rem] transition-colors ${
                vueActive === 'liste' ? 'bg-blue-500 text-white' : 'bg-blue-400 text-white hover:bg-blue-500'
              }`}
            >
              Liste inventaire
            </button>
            <button
              onClick={() => setVueActive('entrees-sorties')}
              className={`px-[1rem] py-[0.5rem] rounded-lg font-semibold text-[0.875rem] transition-colors ${
                vueActive === 'entrees-sorties' ? 'bg-blue-500 text-white' : 'bg-blue-400 text-white hover:bg-blue-500'
              }`}
            >
              Entrées / Sorties
            </button>
            <button
              onClick={() => setVueActive('transactions')}
              className={`px-[1rem] py-[0.5rem] rounded-lg font-semibold text-[0.875rem] transition-colors ${
                vueActive === 'transactions' ? 'bg-blue-500 text-white' : 'bg-blue-400 text-white hover:bg-blue-500'
              }`}
            >
              Afficher les transactions
            </button>
          </div>

          <h1 className="text-[1.5rem] font-bold text-white ml-[1rem]">Inventaire</h1>
        </div>

        <div className="flex items-center gap-[0.5rem] flex-wrap">
          <button
            onClick={() => setShowPiecesModal(true)}
            className="px-[1.25rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
          >
            Pièces
          </button>
          <button
            onClick={() => setShowFournisseursModal(true)}
            className="px-[1.25rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
          >
            Fournisseurs
          </button>
          <button
            onClick={() => setShowUnitesModal(true)}
            className="px-[1.25rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors"
          >
            Unités
          </button>
        </div>
      </div>

      {/* Contenu selon la vue active */}
      {vueActive === 'liste' && VueListeInventaire}
      {vueActive === 'entrees-sorties' && VueEntreesSorties}
      {vueActive === 'transactions' && VueTransactions}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════╗
// ║              EXPORT AVEC TOAST PROVIDER              ║
// ╚══════════════════════════════════════════════════════╝

export default function InventairePage() {
  return (
    <ToastProvider>
      <InventaireContent />
    </ToastProvider>
  );
}