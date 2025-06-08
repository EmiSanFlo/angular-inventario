import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://localhost:3000/productos';

  constructor(private http: HttpClient) {}

  obtenerProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  getProductoDetalle(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  agregarResena(productoId: number, resena: any) {
    return this.http.post(`http://localhost:3000/productos/${productoId}/resenas`, resena);
  }
}