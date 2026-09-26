import { query } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Resilient live-sync store for offline / dev mode
let memorySuppliers = [
  {
    id: 'b2010000-0000-4000-8000-000000000001',
    name: 'Apex Dynamics Corp',
    contactPerson: 'David Sterling',
    contact_person: 'David Sterling',
    email: 'd.sterling@apexdynamics.com',
    phone: '+1 (312) 555-0144',
    location: 'Chicago, IL',
    rating: 4.8,
    leadTimeDays: 7,
    lead_time_days: 7,
    paymentTerms: 'Net 30',
    payment_terms: 'Net 30',
    suppliedCategories: 'Actuators, Sensors & IoT',
    supplied_categories: 'Actuators, Sensors & IoT',
    activeOrders: 3,
    active_orders: 3,
    isActive: true,
    is_active: true,
    createdAt: new Date('2026-01-10T08:00:00Z'),
    created_at: new Date('2026-01-10T08:00:00Z'),
  },
  {
    id: 'b2020000-0000-4000-8000-000000000002',
    name: 'LuminoTech Precision',
    contactPerson: 'Karin Lindqvist',
    contact_person: 'Karin Lindqvist',
    email: 'k.lindqvist@luminotech.se',
    phone: '+46 8 123 4567',
    location: 'Stockholm, Sweden',
    rating: 4.9,
    leadTimeDays: 14,
    lead_time_days: 14,
    paymentTerms: 'Net 45',
    payment_terms: 'Net 45',
    suppliedCategories: 'Sensors & IoT',
    supplied_categories: 'Sensors & IoT',
    activeOrders: 1,
    active_orders: 1,
    isActive: true,
    is_active: true,
    createdAt: new Date('2026-01-12T09:30:00Z'),
    created_at: new Date('2026-01-12T09:30:00Z'),
  },
  {
    id: 'b2030000-0000-4000-8000-000000000003',
    name: 'Vortex Flow Systems',
    contactPerson: 'Robert Chen',
    contact_person: 'Robert Chen',
    email: 'chen.r@vortexflow.com',
    phone: '+1 (713) 442-9901',
    location: 'Houston, TX',
    rating: 4.5,
    leadTimeDays: 10,
    lead_time_days: 10,
    paymentTerms: 'Net 30',
    payment_terms: 'Net 30',
    suppliedCategories: 'Pneumatics',
    supplied_categories: 'Pneumatics',
    activeOrders: 2,
    active_orders: 2,
    isActive: true,
    is_active: true,
    createdAt: new Date('2026-01-15T11:00:00Z'),
    created_at: new Date('2026-01-15T11:00:00Z'),
  },
  {
    id: 'b2040000-0000-4000-8000-000000000004',
    name: 'ElectroCore Global',
    contactPerson: 'Amara Okafor',
    contact_person: 'Amara Okafor',
    email: 'a.okafor@electrocore.de',
    phone: '+49 89 9876 543',
    location: 'Munich, Germany',
    rating: 4.7,
    leadTimeDays: 12,
    lead_time_days: 12,
    paymentTerms: 'Net 60',
    payment_terms: 'Net 60',
    suppliedCategories: 'Controllers, Networking',
    supplied_categories: 'Controllers, Networking',
    activeOrders: 4,
    active_orders: 4,
    isActive: true,
    is_active: true,
    createdAt: new Date('2026-01-18T14:20:00Z'),
    created_at: new Date('2026-01-18T14:20:00Z'),
  },
  {
    id: 'b2050000-0000-4000-8000-000000000005',
    name: 'Titanium Mechanical Inc',
    contactPerson: 'Gregory Hayes',
    contact_person: 'Gregory Hayes',
    email: 'g.hayes@titaniummech.com',
    phone: '+1 (216) 334-1188',
    location: 'Cleveland, OH',
    rating: 4.3,
    leadTimeDays: 15,
    lead_time_days: 15,
    paymentTerms: 'Net 30',
    payment_terms: 'Net 30',
    suppliedCategories: 'Fasteners & Seals',
    supplied_categories: 'Fasteners & Seals',
    activeOrders: 0,
    active_orders: 0,
    isActive: true,
    is_active: true,
    createdAt: new Date('2026-01-20T10:15:00Z'),
    created_at: new Date('2026-01-20T10:15:00Z'),
  },
];

export class Supplier {
  /**
   * List all suppliers with search and pagination
   */
  static async findAll({ search = '', limit = 100, offset = 0 } = {}) {
    try {
      const conditions = ['is_active = TRUE'];
      const params = [];
      let idx = 1;

      if (search) {
        conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx} OR location ILIKE $${idx} OR contact_person ILIKE $${idx})`);
        params.push(`%${search}%`);
        idx++;
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;
      const text = `
        SELECT 
          id,
          name,
          contact_person AS "contactPerson",
          email,
          phone,
          location,
          rating::float AS rating,
          lead_time_days AS "leadTimeDays",
          payment_terms AS "paymentTerms",
          supplied_categories AS "suppliedCategories",
          active_orders AS "activeOrders",
          is_active AS "isActive",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM suppliers
        ${whereClause}
        ORDER BY name ASC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;
      params.push(limit, offset);
      const res = await query(text, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      logger.warn('Direct SQL Supplier.findAll failed, using memory store:', err.message);
    }

    let filtered = memorySuppliers.filter(s => s.isActive !== false && s.is_active !== false);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q)) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q))
      );
    }
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Find single supplier by ID
   */
  static async findById(id) {
    try {
      const text = `
        SELECT 
          id,
          name,
          contact_person AS "contactPerson",
          email,
          phone,
          location,
          rating::float AS rating,
          lead_time_days AS "leadTimeDays",
          payment_terms AS "paymentTerms",
          supplied_categories AS "suppliedCategories",
          active_orders AS "activeOrders",
          is_active AS "isActive",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM suppliers
        WHERE id = $1
      `;
      const res = await query(text, [id]);
      if (res.rows && res.rows[0]) {
        return res.rows[0];
      }
    } catch (err) {
      logger.warn('Direct SQL Supplier.findById failed:', err.message);
    }

    return memorySuppliers.find(s => s.id === id) || null;
  }

  /**
   * Find supplier by Name
   */
  static async findByName(name) {
    try {
      const text = `SELECT * FROM suppliers WHERE LOWER(name) = LOWER($1)`;
      const res = await query(text, [name.trim()]);
      if (res.rows && res.rows[0]) return res.rows[0];
    } catch (err) {
      logger.warn('Direct SQL Supplier.findByName failed:', err.message);
    }
    return memorySuppliers.find(s => s.name.toLowerCase() === name.trim().toLowerCase()) || null;
  }

  /**
   * Create a new supplier
   */
  static async create({
    name,
    contactPerson = '',
    contact_person = '',
    email,
    phone = '',
    location = '',
    rating = 4.5,
    leadTimeDays = 7,
    lead_time_days = 7,
    paymentTerms = 'Net 30',
    payment_terms = 'Net 30',
    suppliedCategories = '',
    supplied_categories = '',
    activeOrders = 0,
    active_orders = 0,
  }) {
    const contact = contactPerson || contact_person || '';
    const leadTime = parseInt(leadTimeDays || lead_time_days || 7, 10);
    const terms = paymentTerms || payment_terms || 'Net 30';
    const rate = parseFloat(rating || 4.5);
    const cats = typeof suppliedCategories === 'string'
      ? suppliedCategories
      : (Array.isArray(suppliedCategories) ? suppliedCategories.join(', ') : (supplied_categories || ''));
    const orders = parseInt(activeOrders || active_orders || 0, 10);

    try {
      const text = `
        INSERT INTO suppliers (
          name, contact_person, email, phone, location, rating, lead_time_days, payment_terms, supplied_categories, active_orders, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
        RETURNING 
          id,
          name,
          contact_person AS "contactPerson",
          email,
          phone,
          location,
          rating::float AS rating,
          lead_time_days AS "leadTimeDays",
          payment_terms AS "paymentTerms",
          supplied_categories AS "suppliedCategories",
          active_orders AS "activeOrders",
          is_active AS "isActive",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `;
      const values = [name.trim(), contact.trim(), email.trim().toLowerCase(), phone.trim(), location.trim(), rate, leadTime, terms.trim(), cats.trim(), orders];
      const res = await query(text, values);
      if (res.rows && res.rows[0]) {
        memorySuppliers.unshift(res.rows[0]);
        return res.rows[0];
      }
    } catch (err) {
      logger.warn('Direct SQL Supplier.create failed, saving to resilient memory store:', err.message);
    }

    const newSupplier = {
      id: `b20${Date.now().toString().slice(-9)}`,
      name: name.trim(),
      contactPerson: contact.trim(),
      contact_person: contact.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      location: location.trim(),
      rating: rate,
      leadTimeDays: leadTime,
      lead_time_days: leadTime,
      paymentTerms: terms.trim(),
      payment_terms: terms.trim(),
      suppliedCategories: cats.trim(),
      supplied_categories: cats.trim(),
      activeOrders: orders,
      active_orders: orders,
      isActive: true,
      is_active: true,
      createdAt: new Date(),
      created_at: new Date(),
      updatedAt: new Date(),
      updated_at: new Date(),
    };

    memorySuppliers.unshift(newSupplier);
    return newSupplier;
  }

  /**
   * Update supplier by ID
   */
  static async update(id, fields = {}) {
    const contact = fields.contactPerson !== undefined ? fields.contactPerson : fields.contact_person;
    const leadTime = fields.leadTimeDays !== undefined ? fields.leadTimeDays : fields.lead_time_days;
    const terms = fields.paymentTerms !== undefined ? fields.paymentTerms : fields.payment_terms;
    const cats = typeof fields.suppliedCategories === 'string'
      ? fields.suppliedCategories
      : (Array.isArray(fields.suppliedCategories) ? fields.suppliedCategories.join(', ') : fields.supplied_categories);

    try {
      const text = `
        UPDATE suppliers
        SET
          name = COALESCE($1, name),
          contact_person = COALESCE($2, contact_person),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          location = COALESCE($5, location),
          rating = COALESCE($6, rating),
          lead_time_days = COALESCE($7, lead_time_days),
          payment_terms = COALESCE($8, payment_terms),
          supplied_categories = COALESCE($9, supplied_categories),
          updated_at = NOW()
        WHERE id = $10
        RETURNING 
          id,
          name,
          contact_person AS "contactPerson",
          email,
          phone,
          location,
          rating::float AS rating,
          lead_time_days AS "leadTimeDays",
          payment_terms AS "paymentTerms",
          supplied_categories AS "suppliedCategories",
          active_orders AS "activeOrders",
          is_active AS "isActive",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `;
      const values = [
        fields.name ? fields.name.trim() : null,
        contact !== undefined ? contact.trim() : null,
        fields.email ? fields.email.trim().toLowerCase() : null,
        fields.phone !== undefined ? fields.phone.trim() : null,
        fields.location !== undefined ? fields.location.trim() : null,
        fields.rating !== undefined ? parseFloat(fields.rating) : null,
        leadTime !== undefined ? parseInt(leadTime, 10) : null,
        terms !== undefined ? terms.trim() : null,
        cats !== undefined ? cats.trim() : null,
        id
      ];
      const res = await query(text, values);
      if (res.rows && res.rows[0]) {
        const updated = res.rows[0];
        const idx = memorySuppliers.findIndex(s => s.id === id);
        if (idx !== -1) memorySuppliers[idx] = { ...memorySuppliers[idx], ...updated };
        return updated;
      }
    } catch (err) {
      logger.warn('Direct SQL Supplier.update failed, updating memory store:', err.message);
    }

    const idx = memorySuppliers.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const existing = memorySuppliers[idx];
    const updated = {
      ...existing,
      name: fields.name || existing.name,
      contactPerson: contact !== undefined ? contact : existing.contactPerson,
      email: fields.email || existing.email,
      phone: fields.phone !== undefined ? fields.phone : existing.phone,
      location: fields.location !== undefined ? fields.location : existing.location,
      rating: fields.rating !== undefined ? parseFloat(fields.rating) : existing.rating,
      leadTimeDays: leadTime !== undefined ? parseInt(leadTime, 10) : existing.leadTimeDays,
      paymentTerms: terms !== undefined ? terms : existing.paymentTerms,
      suppliedCategories: cats !== undefined ? cats : existing.suppliedCategories,
      updatedAt: new Date(),
    };
    memorySuppliers[idx] = updated;
    return updated;
  }

  /**
   * Delete / Deactivate supplier by ID
   */
  static async delete(id) {
    try {
      const text = `UPDATE suppliers SET is_active = FALSE WHERE id = $1 RETURNING id`;
      const res = await query(text, [id]);
      if (res.rows && res.rows[0]) {
        memorySuppliers = memorySuppliers.filter(s => s.id !== id);
        return true;
      }
    } catch (err) {
      logger.warn('Direct SQL Supplier.delete failed:', err.message);
    }
    const lenBefore = memorySuppliers.length;
    memorySuppliers = memorySuppliers.filter(s => s.id !== id);
    return memorySuppliers.length < lenBefore;
  }
}
