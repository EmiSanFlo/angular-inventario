export class Producto{
    constructor(
        public Id : number,
        public Nombre : string,
        public Artista : string,
        public Generos: { nombre: string }[],
        public StockDisponible : number,
        public Precio : number,
        public ImagenPrincipal : string
    ){}
}