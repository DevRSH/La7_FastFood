from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.producto import Producto, IngredienteReceta
from app.models.utensilio import UtensilioReceta
from app.models.packaging import PackagingReceta
from app.schemas.producto import ProductoCreate, ProductoUpdate

async def get_productos(db: AsyncSession, skip: int = 0, limit: int = 100):
    stmt = select(Producto).options(
        selectinload(Producto.ingredientes),
        selectinload(Producto.utensilios_receta),
        selectinload(Producto.packaging_receta)
    ).offset(skip).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())

async def get_producto(db: AsyncSession, producto_id: int):
    stmt = select(Producto).where(Producto.id == producto_id).options(
        selectinload(Producto.ingredientes),
        selectinload(Producto.utensilios_receta),
        selectinload(Producto.packaging_receta)
    )
    res = await db.execute(stmt)
    return res.scalars().first()

async def create_producto(db: AsyncSession, producto: ProductoCreate):
    producto_data = producto.model_dump(exclude={'ingredientes', 'utensilios', 'packagings'})
    db_producto = Producto(**producto_data)
    db.add(db_producto)
    await db.flush()
    
    for ing in producto.ingredientes:
        db_ing = IngredienteReceta(producto_id=db_producto.id, **ing.model_dump())
        db.add(db_ing)
        
    for ute in producto.utensilios:
        db_ute = UtensilioReceta(producto_id=db_producto.id, **ute.model_dump())
        db.add(db_ute)
        
    for pack in producto.packagings:
        db_pack = PackagingReceta(producto_id=db_producto.id, **pack.model_dump())
        db.add(db_pack)
        
    await db.commit()
    await db.refresh(db_producto)
    return db_producto

async def update_producto(db: AsyncSession, db_producto: Producto, producto_update: ProductoUpdate):
    update_data = producto_update.model_dump(exclude_unset=True, exclude={'ingredientes', 'utensilios', 'packagings'})
    for key, value in update_data.items():
        setattr(db_producto, key, value)
        
    if producto_update.ingredientes is not None:
        for ing in db_producto.ingredientes:
            await db.delete(ing)
        await db.flush()
        for ing in producto_update.ingredientes:
            db_ing = IngredienteReceta(producto_id=db_producto.id, **ing.model_dump())
            db.add(db_ing)
            
    if producto_update.utensilios is not None:
        for ute in db_producto.utensilios_receta:
            await db.delete(ute)
        await db.flush()
        for ute in producto_update.utensilios:
            db_ute = UtensilioReceta(producto_id=db_producto.id, **ute.model_dump())
            db.add(db_ute)
            
    if producto_update.packagings is not None:
        for pack in db_producto.packaging_receta:
            await db.delete(pack)
        await db.flush()
        for pack in producto_update.packagings:
            db_pack = PackagingReceta(producto_id=db_producto.id, **pack.model_dump())
            db.add(db_pack)
            
    await db.commit()
    await db.refresh(db_producto)
    return db_producto

async def delete_producto(db: AsyncSession, db_producto: Producto):
    await db.delete(db_producto)
    await db.commit()

