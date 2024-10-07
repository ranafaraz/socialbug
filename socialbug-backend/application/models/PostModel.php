<?php
class PostModel extends CI_Model {

	public function __construct() {
		parent::__construct();
		$this->load->database();  // Load the database library here
	}

	public function getAllPosts() {
		return $this->db->get('posts')->result_array();
	}

	public function insertPost($data) {
		return $this->db->insert('posts', $data);
	}

	public function getPostById($id) {
		return $this->db->where('id', $id)->get('posts')->row_array();
	}

	public function updatePost($id, $data) {
		return $this->db->where('id', $id)->update('posts', $data);
	}

	public function deletePost($id) {
		return $this->db->where('id', $id)->delete('posts');
	}
}
