import type { ComponentType } from 'react'
import BinaryTreeTraversalMaterial from './data-structure/binary-tree-traversal/BinaryTreeTraversalMaterial'
import BstOperationsMaterial from './data-structure/bst-operations/BstOperationsMaterial'
import GraphTraversalMaterial from './data-structure/graph-traversal/GraphTraversalMaterial'
import ArraySearchMaterial from './data-structure/array-search/ArraySearchMaterial'
import HashTableMaterial from './data-structure/hash-table/HashTableMaterial'
import BasicSortingMaterial from './data-structure/basic-sorting/BasicSortingMaterial'
import AdvancedSortingMaterial from './data-structure/advanced-sorting/AdvancedSortingMaterial'
import TrieMaterial from './data-structure/trie/TrieMaterial'
import TensorMaterial from './data-structure/tensor/TensorMaterial'
import CiPipelineMaterial from './cloud-computing/ci-pipeline/CiPipelineMaterial'
import CdPipelineMaterial from './cloud-computing/cd-pipeline/CdPipelineMaterial'
import MonolithMaterial from './cloud-computing/monolith/MonolithMaterial'
import MicroservicesMaterial from './cloud-computing/microservices/MicroservicesMaterial'
import JwtAuthMaterial from './cloud-computing/jwt-auth/JwtAuthMaterial'
import ReliabilityMaterial from './cloud-computing/reliability/ReliabilityMaterial'
import SagaMaterial from './cloud-computing/saga/SagaMaterial'
import ObservabilityMaterial from './cloud-computing/observability/ObservabilityMaterial'
import RateLimitingMaterial from './cloud-computing/rate-limiting/RateLimitingMaterial'
import PathfindingMaterial from './algorithms/pathfinding/PathfindingMaterial'

/**
 * Catalog of all teaching materials, grouped by course (mata kuliah / MK).
 *
 * To add a new material:
 *   1. Create a folder under the right course, e.g.
 *      src/materials/data-structure/binary-search/BinarySearchMaterial.tsx
 *   2. Export a default React component from it.
 *   3. Import it here and add an entry to that course's `materials` array.
 *
 * A material with status 'soon' (and no `component`) shows as a disabled
 * "coming soon" card in the menu — handy for sketching out a syllabus.
 */

export interface Material {
  id: string
  title: string
  subtitle: string
  status: 'ready' | 'soon'
  component?: ComponentType
}

export interface Course {
  id: string
  /** e.g. "MK" — shown as a small chip before the course name. */
  code: string
  name: string
  /** Accent color (hex) used for the course's cards/badges. */
  accent: string
  materials: Material[]
}

export const COURSES: Course[] = [
  {
    id: 'data-structure',
    code: 'MK',
    name: 'Data Structure',
    accent: '#3b82f6',
    materials: [
      {
        id: 'binary-tree-traversal',
        title: 'Binary Tree Traversal',
        subtitle: 'Tree · preorder, inorder, postorder, level-order',
        status: 'ready',
        component: BinaryTreeTraversalMaterial,
      },
      {
        id: 'bst-operations',
        title: 'Binary Search Tree',
        subtitle: 'BST · insert, search, delete (3 kasus)',
        status: 'ready',
        component: BstOperationsMaterial,
      },
      {
        id: 'graph-traversal',
        title: 'Graph Traversal',
        subtitle: 'Graph · BFS & DFS (Queue / Stack)',
        status: 'ready',
        component: GraphTraversalMaterial,
      },
      {
        id: 'array-search',
        title: 'Array Search',
        subtitle: 'Searching · Linear vs Binary Search',
        status: 'ready',
        component: ArraySearchMaterial,
      },
      {
        id: 'hash-table',
        title: 'Hash Table',
        subtitle: 'Hashing · chaining & linear probing',
        status: 'ready',
        component: HashTableMaterial,
      },
      {
        id: 'basic-sorting',
        title: 'Sorting Dasar',
        subtitle: 'Sorting · Bubble, Selection & Insertion',
        status: 'ready',
        component: BasicSortingMaterial,
      },
      {
        id: 'advanced-sorting',
        title: 'Sorting Lanjutan',
        subtitle: 'Sorting · Merge, Quick & Heap (O(n log n))',
        status: 'ready',
        component: AdvancedSortingMaterial,
      },
      {
        id: 'trie',
        title: 'Trie (Prefix Tree)',
        subtitle: 'Big Data & AI · autocomplete berbasis prefix',
        status: 'ready',
        component: TrieMaterial,
      },
      {
        id: 'tensor',
        title: 'Tensor',
        subtitle: 'AI/ML · scalar → vector → matrix → tensor',
        status: 'ready',
        component: TensorMaterial,
      },
    ],
  },
  {
    id: 'algorithms',
    code: 'MK',
    name: 'Algoritma',
    accent: '#0d9488',
    materials: [
      {
        id: 'pathfinding',
        title: 'Pathfinding',
        subtitle: 'Pencarian jalur · BFS, Greedy & A*',
        status: 'ready',
        component: PathfindingMaterial,
      },
    ],
  },
  {
    id: 'cloud-computing',
    code: 'MK',
    name: 'Cloud Computing',
    accent: '#a855f7',
    materials: [
      {
        id: 'ci-pipeline',
        title: 'CI Pipeline',
        subtitle: 'CI/CD · GitHub Actions: test paralel → build',
        status: 'ready',
        component: CiPipelineMaterial,
      },
      {
        id: 'cd-pipeline',
        title: 'CD Pipeline',
        subtitle: 'CI/CD · auto-deploy ke Railway (deploy gate)',
        status: 'ready',
        component: CdPipelineMaterial,
      },
      {
        id: 'monolith',
        title: 'Monolith',
        subtitle: 'Satu app · satu DB shared (pembanding microservices)',
        status: 'ready',
        component: MonolithMaterial,
      },
      {
        id: 'microservices',
        title: 'Microservices',
        subtitle: 'Dekomposisi · request flow via API Gateway',
        status: 'ready',
        component: MicroservicesMaterial,
      },
      {
        id: 'jwt-auth',
        title: 'JWT Auth Patterns',
        subtitle: '3 pola verifikasi token · call Auth vs local vs gateway',
        status: 'ready',
        component: JwtAuthMaterial,
      },
      {
        id: 'reliability',
        title: 'Reliability',
        subtitle: 'Retry & Circuit Breaker · tahan saat service gagal',
        status: 'ready',
        component: ReliabilityMaterial,
      },
      {
        id: 'saga',
        title: 'Saga Pattern',
        subtitle: 'Distributed transaction · commit & compensating rollback',
        status: 'ready',
        component: SagaMaterial,
      },
      {
        id: 'observability',
        title: 'Observability',
        subtitle: 'Logging · Correlation ID tracing lintas service',
        status: 'ready',
        component: ObservabilityMaterial,
      },
      {
        id: 'rate-limiting',
        title: 'Rate Limiting',
        subtitle: 'Security · token bucket di Gateway (429 saat flood)',
        status: 'ready',
        component: RateLimitingMaterial,
      },
      {
        id: 'load-balancing',
        title: 'Load Balancing',
        subtitle: 'Distribusi request ke banyak server',
        status: 'soon',
      },
      {
        id: 'autoscaling',
        title: 'Auto Scaling',
        subtitle: 'Menambah/mengurangi instance sesuai beban',
        status: 'soon',
      },
    ],
  },
]

/** Flat lookup of every runnable material, keyed by `${courseId}/${materialId}`. */
export function findMaterial(courseId: string, materialId: string): Material | undefined {
  return COURSES.find((c) => c.id === courseId)?.materials.find((m) => m.id === materialId)
}
